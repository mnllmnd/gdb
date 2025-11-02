import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// List reviews (filter by product_id or shop_id)
router.get('/', async (req, res) => {
  try {
    const { product_id, shop_id, limit = 50 } = req.query
    const params = []
    let where = []
    if (product_id) { params.push(product_id); where.push(`product_id = $${params.length}`) }
    if (shop_id) { params.push(shop_id); where.push(`shop_id = $${params.length}`) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    // CORRECTION : Utiliser display_name avec alias user_name
    const sql = `SELECT r.id, r.user_id, u.display_name as user_name, r.product_id, r.shop_id, r.rating, r.comment, r.created_at
                 FROM reviews r
                 LEFT JOIN users u ON u.id = r.user_id
                 ${whereSql}
                 ORDER BY r.created_at DESC
                 LIMIT $${params.length + 1}`
    params.push(Number(limit || 50))
    const r = await query(sql, params)

    // compute simple aggregate (average + count)
    let agg = { average: null, count: 0 }
    try {
      const aSql = `SELECT COUNT(*)::int AS count, AVG(rating)::numeric(10,2) AS average FROM reviews ${whereSql}`
      const aRes = await query(aSql, params.slice(0, params.length - 1))
      if (aRes && aRes.rows && aRes.rows[0]) {
        agg.count = Number(aRes.rows[0].count || 0)
        agg.average = aRes.rows[0].average !== null ? Number(aRes.rows[0].average) : null
      }
    } catch (e) { /* ignore aggregate errors */ }

    res.json({ reviews: r.rows || [], aggregate: agg })
  } catch (err) {
    console.error('Failed to list reviews', err)
    res.status(500).json({ error: 'Failed to list reviews' })
  }
})

// Create review (authenticated)
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, shop_id, rating, comment } = req.body
    if (!product_id && !shop_id) return res.status(400).json({ error: 'product_id or shop_id required' })
    const r = await query('INSERT INTO reviews (user_id, product_id, shop_id, rating, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.user.id, product_id || null, shop_id || null, Number(rating), comment || null])
    const created = r.rows[0]
    // attach user_name (display_name)
    try {
      const u = await query('SELECT display_name FROM users WHERE id = $1', [req.user.id])
      created.user_name = u.rows[0]?.display_name || null
    } catch (e) { /* ignore */ }
    // best-effort: refresh cache in background
    try { const { query: dbQuery } = await import('../db.js'); (await import('../cache.js')).default.refresh(dbQuery).catch(()=>{}) } catch (e) {}
    res.json(created)
  } catch (err) {
    console.error('Failed to create review', err)
    // Unique constraint violation (user already reviewed) -> return 409
    if (err && err.code === '23505') return res.status(409).json({ error: 'You already left a review for this item' })
    res.status(500).json({ error: 'Failed to create review' })
  }
})

// Delete review (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const r = await query('SELECT * FROM reviews WHERE id = $1', [id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const rev = r.rows[0]
    // only owner or admin can delete
    if (String(rev.user_id) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    await query('DELETE FROM reviews WHERE id = $1', [id])
    // best-effort cache refresh
    try { const { query: dbQuery } = await import('../db.js'); (await import('../cache.js')).default.refresh(dbQuery).catch(()=>{}) } catch (e) {}
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete review', err)
    res.status(500).json({ error: 'Failed to delete review' })
  }
})

export default router