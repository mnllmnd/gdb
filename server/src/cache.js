import fs from 'fs'
import path from 'path'

let PRODUCTS = []
let SHOPS = []
let CATEGORIES = []
let CACHE_VERSION = Date.now()

const cacheFile = path.resolve(process.cwd(), 'server', 'data', 'cache_snapshot.json')
const CACHE_TTL = 60 * 1000 // 1 minute

const init = async (dbQuery) => {
  try {
    if (fs.existsSync(cacheFile)) {
      const raw = fs.readFileSync(cacheFile, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed) {
        PRODUCTS = parsed.products || []
        SHOPS = parsed.shops || []
        CATEGORIES = parsed.categories || []
        CACHE_VERSION = Date.now()
        console.log('✅ Cache snapshot loaded from disk')
        // If the snapshot does not include delivery columns (older snapshot), refresh from DB
        const firstShop = (SHOPS || [])[0]
        if (!firstShop || typeof firstShop.delivery_price_local === 'undefined' || typeof firstShop.owner_display_name === 'undefined') {
          try {
            // attempt to refresh from DB to get up-to-date fields
            await refresh(dbQuery, true)
            return
          } catch (e) {
            console.warn('Failed to refresh cache after loading snapshot', e && e.message)
            return
          }
        }
        // Ensure owner_display_name exists on loaded shops; try to attach it if missing
        try {
          const ownerIds = Array.from(new Set((SHOPS || []).map(s => s.owner_id).filter(Boolean)))
          if (ownerIds.length > 0) {
            const usersRes = await dbQuery('SELECT id, display_name FROM users WHERE id = ANY($1)', [ownerIds])
            const usersMap = {}
            for (const u of (usersRes.rows || [])) {
              usersMap[String(u.id)] = u.display_name || null
            }
            SHOPS = (SHOPS || []).map(s => ({ ...s, owner_display_name: usersMap[String(s.owner_id)] || null }))
          }
        } catch (e) {
          console.warn('Could not attach owner_display_name to shops loaded from snapshot', e && e.message)
        }
        return
      }
    }
  } catch (err) {
    console.warn('⚠️ Failed to load cache snapshot:', err.message)
  }

  // sinon, on reconstruit depuis la base
  return refresh(dbQuery, true)
}

const refresh = async (dbQuery, force = false) => {
  // Vérifie si le cache est encore frais
  if (!force && Date.now() - CACHE_VERSION < CACHE_TTL) {
    return false
  }

  try {
    const [pRes, sRes, cRes, imgsRes] = await Promise.all([
      dbQuery('SELECT * FROM products ORDER BY created_at DESC'),
  dbQuery('SELECT id, owner_id, name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express FROM shops ORDER BY created_at DESC'),
      dbQuery('SELECT * FROM categories ORDER BY name'),
      dbQuery('SELECT product_id, url, position FROM product_images ORDER BY position ASC')
    ])

    const rawProducts = pRes.rows || []
    SHOPS = sRes.rows || []
    // Attach owner display_name to each shop for easier frontend rendering
    try {
      const ownerIds = Array.from(new Set((SHOPS || []).map(s => s.owner_id).filter(Boolean)))
      if (ownerIds.length > 0) {
        const usersRes = await dbQuery('SELECT id, display_name FROM users WHERE id = ANY($1)', [ownerIds])
        const usersMap = {}
        for (const u of (usersRes.rows || [])) {
          usersMap[String(u.id)] = u.display_name || null
        }
        SHOPS = (SHOPS || []).map(s => ({ ...s, owner_display_name: usersMap[String(s.owner_id)] || null }))
      } else {
        SHOPS = (SHOPS || []).map(s => ({ ...s, owner_display_name: null }))
      }
    } catch (err) {
      console.warn('Could not attach owner display names to shops cache', err && err.message)
      SHOPS = (SHOPS || []).map(s => ({ ...s, owner_display_name: null }))
    }
    CATEGORIES = cRes.rows || []

    // Map des images par produit
    const imgRows = imgsRes?.rows || []
    const imagesMap = {}
    for (const r of imgRows) {
      if (!r || !r.product_id) continue
      if (!imagesMap[r.product_id]) imagesMap[r.product_id] = []
      if (r.url) imagesMap[r.product_id].push(r.url)
    }
    for (const k of Object.keys(imagesMap)) {
      imagesMap[k] = Array.from(new Set(imagesMap[k].filter(Boolean)))
    }

    // Attache les images à chaque produit
    PRODUCTS = rawProducts.map(p => ({
      ...p,
      images: imagesMap[p.id]?.length ? imagesMap[p.id] : (p.image_url ? [p.image_url] : [])
    }))

    // Met à jour la version du cache
    CACHE_VERSION = Date.now()

    // Persiste le snapshot
    try {
      const dir = path.dirname(cacheFile)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(cacheFile, JSON.stringify({ products: PRODUCTS, shops: SHOPS, categories: CATEGORIES }), 'utf8')
    } catch (err) {
      console.warn('⚠️ Could not persist cache snapshot:', err.message)
    }

    console.log(`✅ Cache refreshed (${PRODUCTS.length} produits, ${SHOPS.length} shops, ${CATEGORIES.length} catégories)`)
    return true
  } catch (err) {
    console.error('❌ Cache refresh failed:', err.message)
    return false
  }
}

// -- Accesseurs --
const getProducts = () => PRODUCTS
const getProductById = (id) => PRODUCTS.find(p => String(p.id) === String(id))
const listProducts = (opts = {}) => {
  const { offset = 0, limit = 100 } = opts
  return PRODUCTS.slice(offset, offset + limit)
}
const getShops = () => SHOPS
const getShopByDomain = (domain) => SHOPS.find(s => String(s.domain) === String(domain))
const getCategories = () => CATEGORIES

const getStatus = () => ({
  version: CACHE_VERSION,
  age: Date.now() - CACHE_VERSION,
  productsCount: PRODUCTS.length,
  shopsCount: SHOPS.length,
  categoriesCount: CATEGORIES.length
})

// -- Hook à appeler après toute écriture dans la DB --
const invalidate = async (dbQuery) => {
  console.log('♻️ Invalidation du cache suite à une modification...')
  await refresh(dbQuery, true)
}

export default {
  init,
  refresh,
  invalidate, // 👉 à appeler après INSERT/UPDATE/DELETE
  getProducts,
  getProductById,
  listProducts,
  getShops,
  getShopByDomain,
  getCategories,
  getStatus
}
