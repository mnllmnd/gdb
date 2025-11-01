import fs from 'fs'
import path from 'path'

let PRODUCTS = []
let SHOPS = []
let CATEGORIES = []

const cacheFile = path.resolve(process.cwd(), 'server', 'data', 'cache_snapshot.json')

const init = async (dbQuery) => {
  // try load snapshot
  try {
    if (fs.existsSync(cacheFile)) {
      const raw = fs.readFileSync(cacheFile, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed) {
        PRODUCTS = parsed.products || []
        SHOPS = parsed.shops || []
        CATEGORIES = parsed.categories || []
        console.log('✅ Cache snapshot loaded from disk')
        return
      }
    }
  } catch (err) {
    console.warn('Failed to load cache snapshot:', err.message)
  }

  // otherwise build from DB
  return refresh(dbQuery)
}

const refresh = async (dbQuery) => {
  try {
    const [pRes, sRes, cRes, imgsRes] = await Promise.all([
      dbQuery('SELECT * FROM products ORDER BY created_at DESC'),
      dbQuery('SELECT id, owner_id, name, domain, logo_url, description FROM shops ORDER BY created_at DESC'),
      dbQuery('SELECT * FROM categories ORDER BY name'),
      // fetch product images to attach them to products
      dbQuery('SELECT product_id, url, position FROM product_images ORDER BY position ASC')
    ])
    const rawProducts = pRes.rows || []
    SHOPS = sRes.rows || []
    CATEGORIES = cRes.rows || []

    // map images by product_id
    const imgRows = imgsRes && imgsRes.rows ? imgsRes.rows : []
    const imagesMap = {}
    for (const r of imgRows) {
      if (!r || !r.product_id) continue
      if (!imagesMap[r.product_id]) imagesMap[r.product_id] = []
      imagesMap[r.product_id].push(r.url)
    }

    // attach images array to each product (fallback to image_url legacy column)
    PRODUCTS = rawProducts.map(p => ({
      ...p,
      images: imagesMap[p.id] && imagesMap[p.id].length ? imagesMap[p.id] : (p.image_url ? [p.image_url] : [])
    }))

    // persist snapshot to disk (best-effort)
    try {
      const dir = path.dirname(cacheFile)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(cacheFile, JSON.stringify({ products: PRODUCTS, shops: SHOPS, categories: CATEGORIES }), 'utf8')
    } catch (err) {
      console.warn('Could not persist cache snapshot:', err.message)
    }

    console.log(`✅ Cache refreshed: ${PRODUCTS.length} products, ${SHOPS.length} shops, ${CATEGORIES.length} categories`)
    return true
  } catch (err) {
    console.error('Cache refresh failed:', err.message)
    return false
  }
}

const getProducts = () => PRODUCTS
const getProductById = (id) => PRODUCTS.find(p => String(p.id) === String(id))
const listProducts = (opts = {}) => {
  // simple in-memory filtering/pagination helper
  const { offset = 0, limit = 100 } = opts
  return PRODUCTS.slice(offset, offset + limit)
}
const getShops = () => SHOPS
const getShopByDomain = (domain) => SHOPS.find(s => String(s.domain) === String(domain))
const getCategories = () => CATEGORIES

export default {
  init,
  refresh,
  getProducts,
  getProductById,
  listProducts,
  getShops,
  getShopByDomain,
  getCategories
}
