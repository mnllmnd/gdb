import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { authenticate, generateToken } from '../middleware/auth.js'
import cache from '../cache.js'

const router = express.Router()

// Create or update shop for seller
router.post('/', authenticate, async (req, res) => {
  const { name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express } = req.body
  try {
    // If user is not a seller yet, promote them to seller
    if (req.user.role !== 'seller') {
      await query('UPDATE users SET role = $1 WHERE id = $2', ['seller', req.user.id])
      // regenerate token with new role
      const newToken = generateToken({ id: req.user.id, phone: req.user.phone, role: 'seller' })
      req.newToken = newToken
    }
    // check if seller already has a shop
    const existing = await query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id])
    if (existing.rowCount > 0) {
      const updated = await query(
        'UPDATE shops SET name=$1, domain=$2, logo_url=$3, description=$4, delivery_price_local=$5, delivery_price_regional=$6, delivery_price_express=$7 WHERE owner_id=$8 RETURNING *',
        [
          name ?? existing.rows[0].name,
          domain ?? existing.rows[0].domain,
          logo_url ?? existing.rows[0].logo_url,
          description ?? existing.rows[0].description,
          delivery_price_local ?? existing.rows[0].delivery_price_local,
          delivery_price_regional ?? existing.rows[0].delivery_price_regional,
          delivery_price_express ?? existing.rows[0].delivery_price_express,
          req.user.id,
        ]
      )
      const out = updated.rows[0]
      res.json(req.newToken ? { ...out, token: req.newToken } : out)
      try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after shop update failed', e.message) }
      return
    }
    const r = await query(
      'INSERT INTO shops (owner_id, name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [
        req.user.id,
        name ?? null,
        domain ?? null,
        logo_url ?? null,
        description ?? null,
        delivery_price_local ?? null,
        delivery_price_regional ?? null,
        delivery_price_express ?? null,
      ]
    )
    const out = r.rows[0]
    res.json(req.newToken ? { ...out, token: req.newToken } : out)
    try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after shop create failed', e.message) }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save shop' })
  }
})

// Get shop for current seller
router.get('/me', authenticate, async (req, res) => {
  try {
    // read from DB for single-owner query (freshness) — quick
    const r = await query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'No shop' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Get follow status and count for a shop (optional auth)
router.get('/:id/follow_status', async (req, res) => {
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
        userId = null
      }
    }
    const cnt = await query('SELECT COUNT(*)::int AS count FROM shop_follows WHERE shop_id = $1', [id])
    let followed = false
    if (userId) {
      const r = await query('SELECT 1 FROM shop_follows WHERE shop_id = $1 AND user_id = $2', [id, userId])
      followed = r.rowCount > 0
    }
    res.json({ followed, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to get shop follow status', err)
    res.status(500).json({ error: 'Failed to get follow status' })
  }
})

// List shops the current user follows
router.get('/me/following', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT s.* FROM shop_follows sf JOIN shops s ON s.id = sf.shop_id WHERE sf.user_id = $1 ORDER BY sf.created_at DESC', [req.user.id])
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch followed shops', err)
    res.status(500).json({ error: 'Failed to fetch followed shops' })
  }
})

// Public: get shop by domain
router.get('/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params
    // Try in-memory cache first
    const cached = cache.getShopByDomain(domain)
    if (cached) return res.json(cached)
    const r = await query('SELECT * FROM shops WHERE domain = $1', [domain])
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Public: get shop by owner id
router.get('/owner/:owner_id', async (req, res) => {
  try {
    const { owner_id } = req.params
    const r = await query('SELECT * FROM shops WHERE owner_id = $1', [owner_id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (err) {
    console.error('Failed to fetch shop by owner', err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Public: list shops
router.get('/', async (req, res) => {
  try {
    // Serve cached shops for speed; if cache is empty, fall back to DB
    const cached = cache.getShops()
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.json(cached)
    }

    try {
      const r = await query('SELECT id, owner_id, name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express, created_at FROM shops ORDER BY created_at DESC')
      return res.json(r.rows || [])
    } catch (e) {
      console.warn('DB fallback for shops list failed', e && e.message)
      // return whatever cache returned (likely empty array)
      return res.json(cached || [])
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list shops' })
  }
})

// Public: search shops by name or by product title
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    if (!q) return res.json([])
  // Split into keywords and match if any keyword matches (OR semantics)
  const parts = q.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return res.json([])
  // Build WHERE clause: for each keyword match (s.name ILIKE $i OR p.title ILIKE $i)
  // Use OR between keywords so a shop is returned if any keyword matches
  const whereClauses = parts.map((_, idx) => `(s.name ILIKE $${idx + 1} OR p.title ILIKE $${idx + 1})`).join(' OR ')
  const params = parts.map((p) => `%${p}%`)
    const r = await query(
  `SELECT DISTINCT s.id, s.owner_id, s.name, s.domain, s.logo_url, s.description, s.delivery_price_local, s.delivery_price_regional, s.delivery_price_express, s.created_at
   FROM shops s
   LEFT JOIN products p ON p.seller_id = s.owner_id
   WHERE ${whereClauses}
   ORDER BY s.created_at DESC`,
      params
    )
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to search shops' })
  }
})

// Public: popular shops (ordered by follower count)
router.get('/popular', async (req, res) => {
  try {
    const r = await query(
      `SELECT s.id, s.owner_id, s.name, s.domain, s.logo_url, s.description, s.delivery_price_local, s.delivery_price_regional, s.delivery_price_express, COALESCE(sf.cnt,0)::int AS followers
       FROM shops s
       LEFT JOIN (
         SELECT shop_id, COUNT(*) as cnt FROM shop_follows GROUP BY shop_id
       ) sf ON sf.shop_id = s.id
       ORDER BY followers DESC NULLS LAST, s.created_at DESC
       LIMIT 12`
    )
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch popular shops', err)
    res.status(500).json({ error: 'Failed to fetch popular shops' })
  }
})

// Follow a shop
router.post('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    // ensure shop exists
    const s = await query('SELECT id FROM shops WHERE id = $1', [id])
    if (s.rowCount === 0) return res.status(404).json({ error: 'Shop not found' })
    await query('INSERT INTO shop_follows (user_id, shop_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM shop_follows WHERE shop_id = $1', [id])
    res.json({ followed: true, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to follow shop', err)
    res.status(500).json({ error: 'Failed to follow' })
  }
})

// Unfollow a shop
router.delete('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query('DELETE FROM shop_follows WHERE user_id = $1 AND shop_id = $2', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM shop_follows WHERE shop_id = $1', [id])
    res.json({ followed: false, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to unfollow shop', err)
    res.status(500).json({ error: 'Failed to unfollow' })
  }
})

// Get followers of a shop (count and optional list)
router.get('/:id/followers', async (req, res) => {
  const { id } = req.params
  try {
    const cnt = await query('SELECT COUNT(*)::int AS count FROM shop_follows WHERE shop_id = $1', [id])
    const rows = await query('SELECT u.id, u.display_name, u.email FROM shop_follows sf JOIN users u ON u.id = sf.user_id WHERE sf.shop_id = $1 ORDER BY sf.created_at DESC LIMIT 50', [id])
    res.json({ count: Number(cnt.rows[0]?.count || 0), users: rows.rows })
  } catch (err) {
    console.error('Failed to fetch shop followers', err)
    res.status(500).json({ error: 'Failed to fetch followers' })
  }
})

// Seller: list orders received for this seller's products
router.get('/me/orders', authenticate, async (req, res) => {
  try {
    // join orders with products to find orders for this seller
    const r = await query(
      `SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    )
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Seller: delete a specific order for this seller's product
router.delete('/me/orders/:id', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    // verify order exists and is for a product owned by this seller
    const ord = await query('SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = $1 AND p.seller_id = $2', [id, req.user.id])
    if (ord.rowCount === 0) return res.status(404).json({ error: 'Order not found or not allowed' })
    await query('DELETE FROM orders WHERE id = $1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete order' })
  }
})

// Seller: list clients (buyers) based on orders
router.get('/me/clients', authenticate, async (req, res) => {
  try {
    const r = await query(
      `SELECT DISTINCT u.id, u.display_name, u.email, u.phone FROM users u JOIN orders o ON u.id = o.buyer_id JOIN products p ON o.product_id = p.id WHERE p.seller_id = $1`,
      [req.user.id]
    )
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

// Seller: manage debts stored in shops.debts (JSONB)
router.get('/me/debts', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT debts FROM shops WHERE owner_id = $1', [req.user.id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'No shop' })
    res.json(r.rows[0].debts || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch debts' })
  }
})

router.post('/me/debts', authenticate, async (req, res) => {
  try {
  const { entry } = req.body
    if (!entry) return res.status(400).json({ error: 'Missing entry' })
    const cur = await query('SELECT debts FROM shops WHERE owner_id = $1', [req.user.id])
    if (cur.rowCount === 0) return res.status(404).json({ error: 'No shop' })
    const debts = cur.rows[0].debts || []
    debts.push({ id: Date.now().toString(), ...entry, created_at: new Date() })
    await query('UPDATE shops SET debts = $1 WHERE owner_id = $2', [JSON.stringify(debts), req.user.id])
    res.json(debts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add debt' })
  }
})

// Delete shop (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  await query('BEGIN;')
  try {
    // verify owner
    const s = await query('SELECT * FROM shops WHERE id = $1', [id])
    if (s.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  // allow owner or admin to delete the shop
  if (String(s.rows[0].owner_id) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' })

    // delete orders for products of this shop, then products, then shop
    // find product ids owned by this seller (via owner of shop)
    const ownerId = s.rows[0].owner_id
    const prodRes = await query('SELECT id FROM products WHERE seller_id = $1', [ownerId])
    const prodIds = prodRes.rows.map((r) => r.id)
    if (prodIds.length > 0) {
      // delete orders referencing these products
      await query('DELETE FROM orders WHERE product_id = ANY($1)', [prodIds])
      // delete products
      await query('DELETE FROM products WHERE id = ANY($1)', [prodIds])
    }

    // finally delete the shop
    await query('DELETE FROM shops WHERE id = $1', [id])
    await query('COMMIT;')
    // Invalidate cache BEFORE responding
    try {
      const { query: dbQuery } = await import('../db.js')
      await cache.invalidate(dbQuery)
    } catch (e) {
      console.warn('Cache invalidate after shop delete failed', e.message)
    }
    res.json({ success: true })
    } catch (err) {
    console.error(err)
    try {
      await query('ROLLBACK;')
    } catch (error_) {
      console.warn('Rollback failed', error_)
    }
    res.status(500).json({ error: 'Failed to delete shop' })
  }
})

export default router

