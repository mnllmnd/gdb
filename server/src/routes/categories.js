import express from 'express'
import { query } from '../db.js'
import cache from '../cache.js'

const router = express.Router()

// List all categories (serve from cache)
router.get('/', async (req, res) => {
  try {
    const cats = cache.getCategories()
    if (cats && Array.isArray(cats) && cats.length > 0) return res.json(cats)

    try {
      const r = await query('SELECT * FROM categories ORDER BY name')
      return res.json(r.rows || [])
    } catch (e) {
      console.warn('DB fallback for categories list failed', e && e.message)
      return res.json(cats || [])
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

// Get products by category (serve from cache for speed)
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params
    const cached = cache.getProducts()
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const prods = cached.filter(p => String(p.category_id) === String(id) || String(p.category_id) === String(Number(id)))
      return res.json(prods)
    }

    try {
      const r = await query('SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC', [id])
      return res.json(r.rows || [])
    } catch (e) {
      console.warn('DB fallback for category products failed', e && e.message)
      return res.json(cached || [])
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list products by category' })
  }
})

export default router