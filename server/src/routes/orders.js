import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create order (guest or authenticated)
router.post('/', async (req, res) => {
  const { product_id, product_title, price, buyer_id, payment_method, buyer_name, buyer_phone, address, product_image } = req.body
  try {
    const r = await query(
      `INSERT INTO orders (product_id, product_title, price, buyer_id, payment_method, buyer_name, buyer_phone, address, product_image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [product_id, product_title, price, buyer_id || null, payment_method || 'cash_on_delivery', buyer_name || null, buyer_phone || null, address || null, product_image || null]
    )
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// List orders for authenticated user
router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC', [req.user.id])
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list orders' })
  }
})

// Admin: list all orders
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  try {
    const r = await query('SELECT * FROM orders ORDER BY created_at DESC')
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list orders' })
  }
})

export default router
