import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create order (guest or authenticated)
router.post('/', async (req, res) => {
  const { product_id, product_title, price, buyer_id, payment_method, buyer_name, buyer_phone, address, product_image, delivery_price, delivery_type } = req.body
  try {
    const r = await query(
      `INSERT INTO orders (product_id, product_title, price, buyer_id, payment_method, buyer_name, buyer_phone, address, product_image, delivery_price, delivery_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [product_id, product_title, price, buyer_id || null, payment_method || 'cash_on_delivery', buyer_name || null, buyer_phone || null, address || null, product_image || null, delivery_price || 0, delivery_type || 'pickup']
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
    // Get all orders for products belonging to this seller
    const ordersResult = await query(
      `SELECT 
        o.id, 
        o.product_id, 
        COALESCE(o.product_title, p.title) as product_title, 
        COALESCE(o.price, p.price) as price, 
        o.buyer_id, 
        o.payment_method, 
        COALESCE(o.buyer_name, u.display_name) as buyer_name, 
        COALESCE(o.buyer_phone, u.phone) as buyer_phone, 
        o.address, 
        COALESCE(o.product_image, p.image_url) as product_image, 
        o.status, 
        o.created_at, 
        o.delivery_price,
        o.delivery_type,
        p.seller_id
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.buyer_id = u.id
      WHERE p.seller_id = $1
      ORDER BY o.created_at DESC`,
      [req.user.id]
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

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body
  const id = req.params.id
  try {
    const order = await query('SELECT * FROM orders WHERE id = $1', [id])
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    
    const o = order.rows[0]
    // Check if user is seller of this product
    const product = await query('SELECT seller_id FROM products WHERE id = $1', [o.product_id])
    if (product.rows.length === 0 || String(product.rows[0].seller_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Update order status and updated_at
    const result = await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id])
    
    // Record in history
    await query(
      'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
      [id, o.status, status, req.user.id]
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update order status' })
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

// Get messages for an order
router.get('/:id/messages', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    const result = await query(
      `SELECT * FROM order_messages WHERE order_id = $1 ORDER BY created_at DESC`,
      [id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send message on order
router.post('/:id/messages', authenticate, async (req, res) => {
  const { id } = req.params
  const { message } = req.body
  const userId = req.user.id
  
  try {
    // Verify user is buyer or seller of this order
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id])
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    
    const order = orderResult.rows[0]
    let senderType = null
    
    if (String(order.buyer_id) === String(userId)) {
      senderType = 'buyer'
    } else {
      const product = await query('SELECT seller_id FROM products WHERE id = $1', [order.product_id])
      if (product.rows.length > 0 && String(product.rows[0].seller_id) === String(userId)) {
        senderType = 'seller'
      }
    }
    
    if (!senderType) return res.status(403).json({ error: 'Forbidden' })
    
    const messageResult = await query(
      `INSERT INTO order_messages (order_id, sender_id, sender_type, message) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, senderType, message]
    )
    
    res.status(201).json(messageResult.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
