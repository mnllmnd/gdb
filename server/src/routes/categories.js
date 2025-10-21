import express from 'express'
import { query } from '../db.js'

const router = express.Router()

// List all categories
router.get('/', async (req, res) => {
  try {
    const r = await query('SELECT * FROM categories ORDER BY name')
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

// Get products by category
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params
    const r = await query('SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC', [id])
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list products by category' })
  }
})

export default router