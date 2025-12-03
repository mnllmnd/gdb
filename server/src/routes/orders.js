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

// List orders for seller (orders of their products)
router.get('/seller/me', authenticate, async (req, res) => {
  try {
    // Get all products belonging to this seller
    const productsResult = await query('SELECT id FROM products WHERE seller_id = $1', [req.user.id])
    const productIds = productsResult.rows.map(p => p.id)
    
    if (productIds.length === 0) {
      return res.json([])
    }
    
    // Get all orders for those products
    const ordersResult = await query(
      'SELECT * FROM orders WHERE product_id = ANY($1::uuid[]) ORDER BY created_at DESC',
      [productIds]
    )
    res.json(ordersResult.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list seller orders' })
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

// Cancel an order (buyer can cancel their order if it's not yet shipped)
router.patch('/:id/cancel', authenticate, async (req, res) => {
  const id = req.params.id
  try {
    const r = await query('SELECT * FROM orders WHERE id = $1', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    const order = r.rows[0]
    if (String(order.buyer_id) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' })
    if (order.status === 'expedie') return res.status(400).json({ error: 'Order already shipped' })
    const u = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', ['cancelled', id])
    res.json(u.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

// Delete an order (buyer may delete their order record if not shipped, or seller can delete orders for their products)
router.delete('/:id', authenticate, async (req, res) => {
  const id = req.params.id
  try {
    const r = await query('SELECT * FROM orders WHERE id = $1', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    const order = r.rows[0]
    
    // Check if user is the buyer or the seller of the product
    let isAuthorized = String(order.buyer_id) === String(req.user.id)
    
    if (!isAuthorized) {
      // Check if user is the seller of the product
      const productResult = await query('SELECT seller_id FROM products WHERE id = $1', [order.product_id])
      if (productResult.rows.length > 0) {
        isAuthorized = String(productResult.rows[0].seller_id) === String(req.user.id)
      }
    }
    
    if (!isAuthorized) return res.status(403).json({ error: 'Forbidden' })
    if (order.status === 'expedie') return res.status(400).json({ error: 'Cannot delete a shipped order' })
    await query('DELETE FROM orders WHERE id = $1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete order' })
  }
})

export default router
