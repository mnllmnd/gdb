import express from 'express'
import { query } from '../db.js'
import { authenticate, generateToken } from '../middleware/auth.js'

const router = express.Router()

// Create or update shop for seller
router.post('/', authenticate, async (req, res) => {
  const { name, domain, logo_url, description } = req.body
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
        'UPDATE shops SET name=$1, domain=$2, logo_url=$3, description=$4 WHERE owner_id=$5 RETURNING *',
        [name || existing.rows[0].name, domain || existing.rows[0].domain, logo_url || existing.rows[0].logo_url, description || existing.rows[0].description, req.user.id]
      )
      const out = updated.rows[0]
      if (req.newToken) return res.json({ ...out, token: req.newToken })
      return res.json(out)
    }
    const r = await query(
      'INSERT INTO shops (owner_id, name, domain, logo_url, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, name || null, domain || null, logo_url || null, description || null]
    )
    const out = r.rows[0]
    if (req.newToken) return res.json({ ...out, token: req.newToken })
    res.json(out)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save shop' })
  }
})

// Get shop for current seller
router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'No shop' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Public: get shop by domain
router.get('/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params
    const r = await query('SELECT * FROM shops WHERE domain = $1', [domain])
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Public: list shops
router.get('/', async (req, res) => {
  try {
    const r = await query('SELECT id, owner_id, name, domain, logo_url, description FROM shops ORDER BY created_at DESC')
    res.json(r.rows)
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
      `SELECT DISTINCT s.id, s.owner_id, s.name, s.domain, s.logo_url, s.description
       FROM shops s
       LEFT JOIN products p ON p.shop_id = s.id OR p.seller_id = s.owner_id
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
    if (String(s.rows[0].owner_id) !== String(req.user.id)) return res.status(403).json({ error: 'Not allowed' })

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

