import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../db.js'
import cache from '../cache.js'

const router = express.Router()

// GET /api/feed?limit=20&page=1
// Returns paginated products from shops the authenticated user follows
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = Math.min(100, Number.parseInt(req.query.limit || '20', 10) || 20)
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1)
    const offset = (page - 1) * limit

    const sf = await query('SELECT shop_id FROM shop_follows WHERE user_id = $1', [userId])
    if (sf.rowCount === 0) return res.json({ items: [], total: 0, page, limit })
    const shopIds = sf.rows.map(r => String(r.shop_id))
    console.debug('Feed: user', userId, 'follows shops:', shopIds.length)

    // Try to serve from in-memory cache when possible to avoid repeated DB queries
    try {
      const cachedShops = cache.getShops()
      const cachedProducts = cache.getProducts()
      if (cachedShops && cachedProducts && cachedShops.length > 0 && cachedProducts.length > 0) {
        // Map followed shop ids to their owner_id (seller id)
        const ownerIds = new Set(cachedShops.filter(s => shopIds.includes(String(s.id))).map(s => String(s.owner_id)))
        // Filter products whose seller_id matches any of the owner ids
        const filtered = cachedProducts.filter(p => ownerIds.has(String(p.seller_id)))
        // Sort by created_at desc (cachedProducts may already be sorted but ensure it)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const total = filtered.length
        const items = filtered.slice(offset, offset + limit).map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          image_url: p.image_url,
          product_image: null,
          amount: null,
          created_at: p.created_at,
          shop_id: cachedShops.find(s => String(s.owner_id) === String(p.seller_id))?.id || null,
          shop_name: cachedShops.find(s => String(s.owner_id) === String(p.seller_id))?.name || null,
          shop_domain: cachedShops.find(s => String(s.owner_id) === String(p.seller_id))?.domain || null,
          shop_logo: cachedShops.find(s => String(s.owner_id) === String(p.seller_id))?.logo_url || null,
        }))
        return res.json({ items, total, page, limit, cached: true })
      }
    } catch (error_) {
      console.warn('Feed cache unavailable or failed to serve:', error_ && error_.message)
      // fallthrough to DB-backed query
    }

    const totalRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM products p
       JOIN shops s ON s.owner_id = p.seller_id
       WHERE s.id = ANY($1::uuid[])`,
      [shopIds]
    )
    const total = Number(totalRes.rows[0]?.count || 0)

    const r = await query(
      `SELECT p.id, p.title, p.description, p.price,
              p.image_url,
              /* legacy columns that may not exist in older schemas: provide NULL aliases so frontend code can access them safely */
              NULL::text AS product_image,
              NULL::numeric AS amount,
              p.created_at,
              s.id AS shop_id, s.name AS shop_name, s.domain AS shop_domain, s.logo_url AS shop_logo
       FROM products p
       JOIN shops s ON s.owner_id = p.seller_id
       WHERE s.id = ANY($1::uuid[])
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [shopIds, limit, offset]
    )

    res.json({ items: r.rows, total, page, limit, cached: false })
  } catch (err) {
    console.error('Failed to fetch feed', err)
    res.status(500).json({ error: 'Failed to fetch feed' })
  }
})

export default router
