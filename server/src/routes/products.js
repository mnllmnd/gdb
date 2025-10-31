import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import cache from '../cache.js'

const router = express.Router()

// List products
router.get('/', async (req, res) => {
  try {
    // Serve from in-memory cache for speed
  const offset = Number.parseInt(req.query.offset || '0', 10)
  const limit = Number.parseInt(req.query.limit || '100', 10)
    const list = cache.listProducts({ offset, limit })
    // If cache is empty (e.g. stale snapshot or wasn't initialized), fall back to DB
    if (!list || list.length === 0) {
      try {
        const r = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
        const rows = r.rows || []
        // attempt to refresh cache in background for future requests
        try {
          const { query: dbQuery } = await import('../db.js')
          cache.refresh(dbQuery).catch(e => console.warn('Background cache.refresh failed', e && e.message))
        } catch (e) {
          console.warn('Failed to start background cache refresh', e && e.message)
        }
        return res.json(rows)
      } catch (err) {
        console.warn('DB fallback for products list failed', err && err.message)
        // continue to return whatever the cache returned (empty array)
      }
    }
    return res.json(list)
  } catch (err) {
    console.error(err)
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

    const product = await query('SELECT * FROM products WHERE id = $1', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    return res.json(product.rows[0])
  } catch (err) {
    console.error('Failed to get product', err)
    res.status(500).json({ error: 'Failed to get product' })
  }
})

// Create product (seller)
router.post('/', authenticate, requireRole('seller'), async (req, res) => {
  const { title, description, price, image_url, category_id, quantity } = req.body
  try {
    // ensure the seller has a shop before allowing product creation
    const shopCheck = await query('SELECT id FROM shops WHERE owner_id = $1', [req.user.id])
    if (shopCheck.rowCount === 0) return res.status(400).json({ error: 'You must create a shop before adding products' })
    // Validate required fields before sending to the DB to provide clearer errors and avoid DB NOT NULL failures
    if (!title) return res.status(400).json({ error: 'title is required' })
    // price must be provided and a finite number
    if (!Number.isFinite(Number(price))) return res.status(400).json({ error: 'price is required and must be a number' })
    const parsedPrice = Number(price)
    const qty = Number.isFinite(Number(quantity)) ? Math.max(0, parseInt(Number(quantity), 10)) : 0

    // Log incoming payload and final params for easier debugging when something goes wrong
    console.debug('Creating product, payload:', { title, description, price, image_url, category_id, quantity, userId: req.user.id })
    const params = [title, description || null, parsedPrice, image_url || null, category_id, req.user.id, qty]
    console.debug('INSERT params:', params)

    const r = await query(
      'INSERT INTO products (title, description, price, image_url, category_id, seller_id, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      params
    )
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
  // include category_id and quantity
  const { title, description, price, image_url, category_id, quantity } = req.body
  try {
    // check owner
    const product = await query('SELECT * FROM products WHERE id = $1', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const p = product.rows[0]
    if (req.user.role !== 'admin' && p.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    // Use nullish coalescing so falsy values like 0 are preserved correctly
    const qty = typeof quantity !== 'undefined' ? (Number.isFinite(Number(quantity)) ? Math.max(0, parseInt(Number(quantity), 10)) : p.quantity ?? 0) : p.quantity

    // If the client provided a price, validate it (don't allow explicit null/invalid values to reach the DB)
    let finalPrice = p.price
    if (typeof price !== 'undefined') {
      if (!Number.isFinite(Number(price))) return res.status(400).json({ error: 'price must be a number' })
      finalPrice = Number(price)
    }

    const params = [title ?? p.title, description ?? p.description, finalPrice, image_url ?? p.image_url, category_id ?? p.category_id, qty, id]
    console.debug('UPDATE params:', params)
    const updated = await query(
      'UPDATE products SET title=$1, description=$2, price=$3, image_url=$4, category_id=$5, quantity=$6 WHERE id=$7 RETURNING *',
      params
    )
    res.json(updated.rows[0])
    try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after update failed', e.message) }
  } catch (err) {
    console.error('Update product failed', err)
    if (err && err.code === '23502' && err.column) {
      return res.status(400).json({ error: `Missing required column: ${err.column}` })
    }
    res.status(500).json({ error: 'Failed to update' })
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
    res.json({ success: true })
    try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after delete failed', e.message) }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// Get likes info for a product (count and whether current user liked it)
router.get('/:id/likes', async (req, res) => {
  const { id } = req.params
  try {
    let userId = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        userId = decoded.id
      } catch (e) {
        // ignore invalid token — treat as anonymous
        userId = null
      }
    }

    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    const count = Number(cnt.rows[0]?.count || 0)
    let liked = false
    if (userId) {
      const r = await query('SELECT 1 FROM likes WHERE product_id = $1 AND user_id = $2', [id, userId])
      liked = r.rowCount > 0
    }
    res.json({ count, liked })
  } catch (err) {
    console.error('Failed to get likes', err)
    res.status(500).json({ error: 'Failed to get likes' })
  }
})

// Like a product
router.post('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query('INSERT INTO likes (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    res.json({ liked: true, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Like failed', err)
    res.status(500).json({ error: 'Like failed' })
  }
})

// Unlike a product
router.delete('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query('DELETE FROM likes WHERE user_id = $1 AND product_id = $2', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM likes WHERE product_id = $1', [id])
    res.json({ liked: false, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Unlike failed', err)
    res.status(500).json({ error: 'Unlike failed' })
  }
})

export default router

