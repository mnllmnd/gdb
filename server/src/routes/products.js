import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import cache from '../cache.js'
import cleanText from '../utils/clean_text.js'
import { computeEmbedding } from '../embeddings.js'

const router = express.Router()

// List products
router.get('/', async (req, res) => {
  try {
    console.debug('[GET /products] fetching products')
    // Serve from in-memory cache for speed
    const offset = Number.parseInt(req.query.offset || '0', 10)
    const limit = Number.parseInt(req.query.limit || '100', 10)
    console.debug('[GET /products] offset=', offset, 'limit=', limit)
    const list = cache.listProducts({ offset, limit })
    // If cache is empty (e.g. stale snapshot or wasn't initialized), fall back to DB
    if (!list || list.length === 0) {
      try {
        console.debug('[GET /products] cache empty, querying database')
        const r = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
        const rows = r.rows || []
        console.debug('[GET /products] database returned', rows.length, 'products')
        // attach images for those products
        try {
          const ids = rows.map(r => r.id)
          if (ids.length) {
            const imgs = await query('SELECT product_id, url, position FROM product_images WHERE product_id = ANY($1)', [ids])
            const map = {}
            ;(imgs.rows || []).forEach(ir => {
              if (!ir || !ir.product_id) return
              if (!map[ir.product_id]) map[ir.product_id] = []
              if (ir.url) map[ir.product_id].push(ir.url)
            })
            // deduplicate while preserving order
            for (const k of Object.keys(map)) {
              map[k] = Array.from(new Set(map[k].filter(Boolean)))
            }
            for (const p of rows) {
              p.images = map[p.id] && map[p.id].length ? map[p.id] : (p.image_url ? [p.image_url] : [])
            }
          }
        } catch (e) {
          console.warn('[GET /products] non-fatal error loading images:', e && e.message)
        }
        // attempt to refresh cache in background for future requests
        try {
          const { query: dbQuery } = await import('../db.js')
          cache.refresh(dbQuery).catch(e => console.warn('Background cache.refresh failed', e && e.message))
        } catch (e) {
          console.warn('Failed to start background cache refresh', e && e.message)
        }
        return res.json(rows)
      } catch (err) {
        console.error('[GET /products] DB fallback error:', err.message, 'stack:', err.stack)
        // continue to return whatever the cache returned (empty array)
      }
    }
    console.debug('[GET /products] returning', list.length, 'products from cache')
    return res.json(list)
  } catch (err) {
    console.error('[GET /products] ERROR:', err.message, 'stack:', err.stack)
    res.status(500).json({ error: 'Failed to list products' })
  }
})

// Get single product by id (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    // Try cache first
    const cached = cache.getProductById(id)
    if (cached) return res.json(cached)

    const product = await query('SELECT * FROM products WHERE id = $1::uuid', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const p = product.rows[0]
    try {
      const imgs = await query('SELECT url FROM product_images WHERE product_id = $1::uuid ORDER BY position ASC', [id])
      const urls = (imgs.rows || []).map(r => r.url).filter(Boolean)
      p.images = Array.from(new Set(urls))
      if ((!p.images || p.images.length === 0) && p.image_url) p.images = [p.image_url]
    } catch (e) { /* ignore */ }
    return res.json(p)
  } catch (err) {
    console.error('Failed to get product', err)
    res.status(500).json({ error: 'Failed to get product' })
  }
})

// Create product (authenticated user) - allow users to list a product without creating a shop
router.post('/', authenticate, async (req, res) => {
  const { title, description, price, image_url, category_id, quantity, images, discount, original_price } = req.body
  try {
    // Allow product creation even if the user doesn't own a shop. The product will
    // still be associated with the creating user's id (seller_id) so it can be
    // managed later if they create a shop.
    // Clean inputs to avoid mojibake and strip control chars, and normalize UTF-8
    const cleanedTitle = cleanText(title)
    const cleanedDescription = cleanText(description)

    // Validate required fields before sending to the DB to provide clearer errors and avoid DB NOT NULL failures
    if (!cleanedTitle) return res.status(400).json({ error: 'title is required' })
    // price must be provided and a finite number
    if (!Number.isFinite(Number(price))) return res.status(400).json({ error: 'price is required and must be a number' })
    const parsedPrice = Number(price)
    const qty = Number.isFinite(Number(quantity)) ? Math.max(0, parseInt(Number(quantity), 10)) : 0

    // Log incoming payload and final params for easier debugging when something goes wrong
    console.debug('Creating product, payload:', { title, description, price, image_url, category_id, quantity, userId: req.user.id })
    const params = [
      cleanedTitle, 
      cleanedDescription || null, 
      parsedPrice, 
      original_price || parsedPrice,  // Si pas de prix original, utiliser le prix actuel
      discount || 0,  // Si pas de réduction, mettre 0
      image_url || null, 
      category_id, 
      req.user.id, 
      qty
    ]
    console.debug('INSERT params:', params)

    const r = await query(
      'INSERT INTO products (title, description, price, original_price, discount, image_url, category_id, seller_id, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      params
    )
    const created = r.rows[0]
    // compute and persist embedding (best-effort). If embedding computation fails
    // we don't block the response; this is a best-effort enrichment.
    try {
      const textForEmbedding = `${created.title || ''}\n\n${created.description || ''}`
      const emb = await computeEmbedding(textForEmbedding)
      if (emb && Array.isArray(emb) && emb.length) {
        const lit = '[' + emb.map(n => Number(n)).join(',') + ']'
        try {
          await query('UPDATE products SET embedding = $2::vector WHERE id = $1', [created.id, lit])
        } catch (ie) {
          console.warn('Failed to persist embedding to DB', ie && ie.message)
        }
      }
    } catch (ee) {
      console.warn('Embedding compute error after create', ee && ee.message)
    }
    // if images array provided, persist into product_images
    if (Array.isArray(images) && images.length) {
      try {
        // remove any existing (should be none for new product) and insert
        for (let i = 0; i < images.length; i++) {
          const url = images[i]
          if (!url) continue
          await query('INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)', [created.id, url, i])
        }
        // attach images to response object
        created.images = images
      } catch (e) { console.warn('Failed to persist product images', e && e.message) }
    } else {
      created.images = created.image_url ? [created.image_url] : []
    }
    // Refresh cache before responding so the new product is immediately visible to other users
    try {
      const { query: dbQuery } = await import('../db.js')
      await cache.refresh(dbQuery)
    } catch (e) {
      console.warn('Cache refresh after create failed', e.message)
      // fallthrough: still return the created product even if cache refresh failed
    }
    res.json(r.rows[0])
  } catch (err) {
    console.error('Create product failed', err)
    // If this is a PG error about NOT NULL we can provide a clearer message
    if (err && err.code === '23502' && err.column) {
      return res.status(400).json({ error: `Missing required column: ${err.column}` })
    }
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// Update product (seller or admin)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  // include category_id, quantity, and discount fields
  const { title, description, price, image_url, category_id, quantity, images, discount, original_price } = req.body
  try {
    // check owner
    const product = await query('SELECT * FROM products WHERE id = $1::uuid', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const p = product.rows[0]
    if (req.user.role !== 'admin' && p.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    // Use nullish coalescing so falsy values like 0 are preserved correctly
    const qty = typeof quantity !== 'undefined' ? (Number.isFinite(Number(quantity)) ? Math.max(0, parseInt(Number(quantity), 10)) : p.quantity ?? 0) : p.quantity

    // Clean any provided title/description before saving
    const cleanedTitle = typeof title !== 'undefined' ? cleanText(title) : undefined
    const cleanedDescription = typeof description !== 'undefined' ? cleanText(description) : undefined

    // If the client provided a price, validate it (don't allow explicit null/invalid values to reach the DB)
    let finalPrice = p.price
    if (typeof price !== 'undefined') {
      if (!Number.isFinite(Number(price))) return res.status(400).json({ error: 'price must be a number' })
      finalPrice = Number(price)
    }

    // Traiter le prix original et la réduction
    let finalOriginalPrice = p.original_price
    if (typeof original_price !== 'undefined') {
      if (!Number.isFinite(Number(original_price))) return res.status(400).json({ error: 'original_price must be a number' })
      finalOriginalPrice = Number(original_price)
    }

    let finalDiscount = p.discount ?? 0
    if (typeof discount !== 'undefined') {
      if (!Number.isFinite(Number(discount)) || Number(discount) < 0 || Number(discount) > 100) {
        return res.status(400).json({ error: 'discount must be a number between 0 and 100' })
      }
      finalDiscount = Number(discount)
    }

    const params = [
      cleanedTitle ?? p.title,
      cleanedDescription ?? p.description,
      finalPrice,
      finalOriginalPrice ?? finalPrice,
      finalDiscount,
      image_url ?? p.image_url,
      category_id ?? p.category_id,
      qty,
      id
    ]
    console.debug('UPDATE params:', params)
    const updated = await query(
      'UPDATE products SET title=$1, description=$2, price=$3, original_price=$4, discount=$5, image_url=$6, category_id=$7, quantity=$8 WHERE id=$9 RETURNING *',
      params
    )
    const updatedProduct = updated.rows[0]
    // Recompute embedding for updated product (best-effort)
    try {
      const textForEmbedding = `${updatedProduct.title || ''}\n\n${updatedProduct.description || ''}`
      const emb = await computeEmbedding(textForEmbedding)
      if (emb && Array.isArray(emb) && emb.length) {
        const lit = '[' + emb.map(n => Number(n)).join(',') + ']'
        try {
          await query('UPDATE products SET embedding = $2::vector WHERE id = $1', [id, lit])
        } catch (ie) {
          console.warn('Failed to persist embedding to DB on update', ie && ie.message)
        }
      }
    } catch (ee) {
      console.warn('Embedding compute error after update', ee && ee.message)
    }
    // if images provided, replace them
    if (Array.isArray(images)) {
      try {
        await query('DELETE FROM product_images WHERE product_id = $1', [id])
        for (let i = 0; i < images.length; i++) {
          const url = images[i]
          if (!url) continue
          await query('INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)', [id, url, i])
        }
        updatedProduct.images = images
      } catch (e) { console.warn('Failed to update product images', e && e.message) }
    } else {
      // attempt to attach existing images
      try {
        const imgs = await query('SELECT url FROM product_images WHERE product_id = $1 ORDER BY position ASC', [id])
        const urls = (imgs.rows || []).map(r => r.url).filter(Boolean)
        updatedProduct.images = Array.from(new Set(urls))
        if ((!updatedProduct.images || updatedProduct.images.length === 0) && updatedProduct.image_url) updatedProduct.images = [updatedProduct.image_url]
      } catch (e) { /* ignore */ }
    }

    // Invalidate cache BEFORE responding so next requests see updated data
    try {
      const { query: dbQuery } = await import('../db.js')
      await cache.invalidate(dbQuery)
    } catch (e) {
      console.warn('Cache invalidate after update failed', e.message)
    }
    res.json(updatedProduct)
  } catch (err) {
    console.error('Update product failed', err)
    if (err && err.code === '23502' && err.column) {
      return res.status(400).json({ error: `Missing required column: ${err.column}` })
    }
    res.status(500).json({ error: 'Failed to update' })
  }
})

// Get similar products using embeddings (pgvector)
router.get('/:id/similar', async (req, res) => {
  const { id } = req.params
  const limit = Number.parseInt(req.query.limit || '8', 10)

  try {
    // Récupérer l'embedding du produit courant
    const prodR = await query('SELECT embedding, category_id FROM products WHERE id = $1', [id])
    if (prodR.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const { embedding, category_id } = prodR.rows[0]

    let results = []

    if (embedding) {
      // 1️⃣ Rechercher les produits les plus proches via embedding
      try {
        const r = await query(
          `SELECT *, embedding <#> $1 AS distance
           FROM products
           WHERE id != $2
           ORDER BY embedding <#> $1
           LIMIT $3`,
          [embedding, id, limit]
        )
        results = r.rows || []
      } catch (e) {
        console.warn('Vector similarity query failed', e?.message)
      }
    }

    // 2️⃣ Si pas assez de résultats, compléter avec produits de même catégorie
    if (results.length < limit && category_id) {
      const remaining = limit - results.length
      try {
        const r2 = await query(
          `SELECT * FROM products
           WHERE id != $1 AND category_id = $2
           ORDER BY created_at DESC
           LIMIT $3`,
          [id, category_id, remaining]
        )
        const newRows = (r2.rows || []).filter(r => !results.find(rr => rr.id === r.id))
        results = results.concat(newRows)
      } catch (e) {
        console.warn('Category fallback query failed', e?.message)
      }
    }

    // 3️⃣ Fallback ultime : produits récents
    if (results.length < limit) {
      const remaining = limit - results.length
      try {
        const r3 = await query(
          `SELECT * FROM products
           WHERE id != $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [id, remaining]
        )
        const newRows = (r3.rows || []).filter(r => !results.find(rr => rr.id === r.id))
        results = results.concat(newRows)
      } catch (e) {
        console.warn('Recent products fallback failed', e?.message)
      }
    }

    // 4️⃣ Attacher les images comme dans ton endpoint actuel
    if (results.length) {
      try {
        const ids = results.map(r => r.id)
        const imgs = await query(
          'SELECT product_id, url, position FROM product_images WHERE product_id = ANY($1)',
          [ids]
        )
        const map = {}
        ;(imgs.rows || []).forEach(ir => {
          if (!ir || !ir.product_id) return
          if (!map[ir.product_id]) map[ir.product_id] = []
          if (ir.url) map[ir.product_id].push(ir.url)
        })
        for (const k of Object.keys(map)) map[k] = Array.from(new Set(map[k].filter(Boolean)))
        for (const p of results) p.images = map[p.id]?.length ? map[p.id] : (p.image_url ? [p.image_url] : [])
      } catch (e) {
        console.warn('Failed to attach images', e?.message)
      }
    }

    return res.json(results)
  } catch (err) {
    console.error('Failed to get similar products', err)
    res.status(500).json({ error: 'Failed to get similar products' })
  }
})

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    const product = await query('SELECT * FROM products WHERE id = $1', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const p = product.rows[0]
    if (req.user.role !== 'admin' && p.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    await query('DELETE FROM products WHERE id = $1', [id])
    // Invalidate cache BEFORE responding
    try {
      const { query: dbQuery } = await import('../db.js')
      await cache.invalidate(dbQuery)
    } catch (e) {
      console.warn('Cache invalidate after delete failed', e.message)
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// Get likes info for a product (count and whether current user liked it)
router.get('/:id/likes', async (req, res) => {
  const { id } = req.params
  try {
    console.debug(`[GET /likes] productId=${id}`)
    let userId = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        userId = decoded.id
        console.debug(`[GET /likes] authenticated userId=${userId}`)
      } catch (e) {
        console.debug(`[GET /likes] token verification failed: ${e.message}`)
        userId = null
      }
    }

    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    const count = Number(cnt.rows[0]?.count || 0)
    console.debug(`[GET /likes] count=${count}`)
    let liked = false
    if (userId) {
      const r = await query('SELECT 1 FROM likes WHERE product_id = $1 AND user_id = $2', [id, userId])
      liked = r.rowCount > 0
      console.debug(`[GET /likes] liked=${liked}`)
    }
    res.json({ count, liked })
  } catch (err) {
    console.error('[GET /likes] ERROR:', err.message, 'productId:', id, 'stack:', err.stack)
    res.status(500).json({ error: 'Failed to get likes' })
  }
})

// Like a product
router.post('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    console.debug(`[POST /like] userId=${req.user.id}, productId=${id}`)
    await query('INSERT INTO likes (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    const count = Number(cnt.rows[0]?.count || 0)
    console.debug(`[POST /like] inserted, count=${count}`)
    res.json({ liked: true, count })
  } catch (err) {
    console.error('[POST /like] ERROR:', err.message, 'userId:', req.user.id, 'productId:', id, 'stack:', err.stack)
    res.status(500).json({ error: 'Like failed' })
  }
})

// Unlike a product
router.delete('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    console.debug(`[DELETE /like] userId=${req.user.id}, productId=${id}`)
    await query('DELETE FROM likes WHERE user_id = $1 AND product_id = $2', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    const count = Number(cnt.rows[0]?.count || 0)
    console.debug(`[DELETE /like] deleted, count=${count}`)
    res.json({ liked: false, count })
  } catch (err) {
    console.error('[DELETE /like] ERROR:', err.message, 'userId:', req.user.id, 'productId:', id, 'stack:', err.stack)
    res.status(500).json({ error: 'Unlike failed' })
  }
})

export default router