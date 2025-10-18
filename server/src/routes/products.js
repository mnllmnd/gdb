import express from 'express'
import { query } from '../db.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// List products
router.get('/', async (req, res) => {
  try {
    const r = await query('SELECT * FROM products ORDER BY created_at DESC')
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list products' })
  }
})

// Create product (seller)
router.post('/', authenticate, requireRole('seller'), async (req, res) => {
  const { title, description, price, image_url } = req.body
  try {
    // ensure the seller has a shop before allowing product creation
    const shopCheck = await query('SELECT id FROM shops WHERE owner_id = $1', [req.user.id])
    if (shopCheck.rowCount === 0) return res.status(400).json({ error: 'You must create a shop before adding products' })
    const r = await query(
      'INSERT INTO products (title, description, price, image_url, seller_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description || null, price, image_url || null, req.user.id]
    )
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// Update product (seller or admin)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  const { title, description, price, image_url } = req.body
  try {
    // check owner
    const product = await query('SELECT * FROM products WHERE id = $1', [id])
    if (product.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const p = product.rows[0]
    if (req.user.role !== 'admin' && p.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    const updated = await query(
      'UPDATE products SET title=$1, description=$2, price=$3, image_url=$4 WHERE id=$5 RETURNING *',
      [title || p.title, description || p.description, price || p.price, image_url || p.image_url, id]
    )
    res.json(updated.rows[0])
  } catch (err) {
    console.error(err)
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

export default router
