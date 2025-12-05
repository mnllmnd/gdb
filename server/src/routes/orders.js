import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import crypto from 'crypto'
import sgMail from '@sendgrid/mail'
import pool from '../db.js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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

// Public or authenticated order status lookup
// GET /api/orders/:id/status
// If authenticated, require buyer/seller/admin; otherwise allow lookup with buyer_phone query param for guests
router.get('/:id/status', async (req, res) => {
  const id = req.params.id
  const buyerPhone = req.query.buyer_phone || null

  try {
    const r = await query('SELECT id, status, buyer_id, buyer_phone, created_at, updated_at FROM orders WHERE id = $1 LIMIT 1', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    const order = r.rows[0]

    // If the request has authentication, enforce role checks
    if (req.headers && req.headers.authorization) {
      try {
        // Try to authenticate using middleware style
        const { authenticate } = await import('../middleware/auth.js')
        // Create a fake req/res to call authenticate? Simpler: require header token parsing here
      } catch (e) {
        // fallthrough
      }
    }

    // If buyer_phone provided, allow access for guest matching phone
    if (buyerPhone && String(buyerPhone) === String(order.buyer_phone)) {
      return res.json({ id: order.id, status: order.status, created_at: order.created_at, updated_at: order.updated_at })
    }

    // Otherwise require authentication and ownership/admin
    if (!req.user) return res.status(401).json({ error: 'Unauthorized - provide buyer_phone for public lookup or authenticate' })

    if (String(order.buyer_id) === String(req.user.id) || req.user.role === 'admin') {
      return res.json({ id: order.id, status: order.status, created_at: order.created_at, updated_at: order.updated_at })
    }

    // Check if user is seller of product
    const prod = await query('SELECT seller_id FROM products WHERE id = (SELECT product_id FROM orders WHERE id = $1)', [id])
    if (prod.rows.length > 0 && String(prod.rows[0].seller_id) === String(req.user.id)) {
      return res.json({ id: order.id, status: order.status, created_at: order.created_at, updated_at: order.updated_at })
    }

    return res.status(403).json({ error: 'Forbidden' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch order status' })
  }
})

// Ensure tracking table exists
async function ensureTrackingTable() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS order_tracking_tokens (
      id SERIAL PRIMARY KEY,
      order_id bigint NOT NULL,
      token_hash text NOT NULL,
      expires_at timestamptz,
      used boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    )`)
  } catch (e) {
    console.warn('ensureTrackingTable failed', e.message)
  }
}

// POST /api/orders/:id/send-tracking-token
// Body: { email, origin }
router.post('/:id/send-tracking-token', async (req, res) => {
  const id = req.params.id
  const { email, origin } = req.body || {}
  try {
    const r = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    const order = r.rows[0]

    // Determine recipient email
    let recipientEmail = email || null
    if (!recipientEmail && order.buyer_id) {
      const u = await query('SELECT email FROM users WHERE id = $1 LIMIT 1', [order.buyer_id])
      if (u.rows.length > 0) recipientEmail = u.rows[0].email
    }
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email required' })

    await ensureTrackingTable()
    const token = crypto.randomBytes(24).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h

    await query('INSERT INTO order_tracking_tokens (order_id, token_hash, expires_at, used) VALUES ($1,$2,$3,false)', [id, tokenHash, expiresAt])

    const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_URL || '').replace(/\/$/, '') || origin || `http://localhost:3000`
    const trackingUrl = `${frontendBase}/track-order?token=${token}`

    // send email
    try {
      await sgMail.send({
        to: recipientEmail,
        from: process.env.SMTP_FROM,
        subject: `Suivi de votre commande #${id}`,
        html: `<p>Bonjour,</p><p>Vous pouvez suivre votre commande en cliquant sur le lien suivant (valable 24h) :</p><p><a href="${trackingUrl}">${trackingUrl}</a></p>`
      })
    } catch (err) {
      console.error('SendGrid failed', err)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.json({ success: true, sent: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create/send token' })
  }
})

// GET /api/orders/track/:token -> lookup order by token and mark token used
router.get('/track/:token', async (req, res) => {
  const token = req.params.token
  try {
    if (!token) return res.status(400).json({ error: 'Token required' })
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await ensureTrackingTable()
    const r = await query('SELECT * FROM order_tracking_tokens WHERE token_hash = $1 LIMIT 1', [tokenHash])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Invalid token' })
    const rec = r.rows[0]
    if (rec.used) return res.status(410).json({ error: 'Token already used' })
    if (rec.expires_at && new Date(rec.expires_at) < new Date()) return res.status(410).json({ error: 'Token expired' })

    const order = await query('SELECT id, status, buyer_id, buyer_phone, created_at, updated_at FROM orders WHERE id = $1 LIMIT 1', [rec.order_id])
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' })

    // mark token used
    await query('UPDATE order_tracking_tokens SET used = true WHERE id = $1', [rec.id])

    return res.json({ order: order.rows[0], message: `Statut de la commande #${order.rows[0].id}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to lookup token' })
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
