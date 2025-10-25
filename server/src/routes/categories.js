import express from 'express'
import { query } from '../db.js'
import cache from '../cache.js'

const router = express.Router()

// List all categories (serve from cache)
router.get('/', async (req, res) => {
  try {
    const cats = cache.getCategories()
    return res.json(cats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

// Get products by category (serve from cache for speed)
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params
    const prods = cache.getProducts().filter(p => String(p.category_id) === String(id) || String(p.category_id) === String(Number(id)))
    return res.json(prods)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list products by category' })
  }
})

export default router