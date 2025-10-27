import express from 'express'
import { query } from '../db.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import multer from 'multer'
import { uploadReelStream } from '../cloudinary.js'

// multer for handling multipart uploads (memoryStorage for streaming to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB limit (adjust as needed)
})
import { uploadReel } from '../cloudinary.js'
import cache from '../cache.js'
import reelCache from '../reel_cache.js'

const router = express.Router()

// POST /api/reels/upload
// multipart/form-data expected with file field 'reel' and fields: product_id, caption, visibility
router.post('/upload', authenticate, requireRole('seller'), upload.single('reel'), async (req, res) => {
  try {
    // Accept multipart: file field 'reel' + product_id + caption + visibility
    const file = req.file
    const { product_id, caption, visibility } = req.body
    const userId = req.user.id

    if (!file) return res.status(400).json({ error: 'No file uploaded (expected field: reel)' })

    // Validate product ownership
    const p = await query('SELECT * FROM products WHERE id = $1', [product_id])
    if (p.rowCount === 0) return res.status(404).json({ error: 'Product not found' })
    if (String(p.rows[0].seller_id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' })

    // Optional: validate mimetype and duration client-side; here we check mimetype
    if (!file.mimetype.startsWith('video/')) return res.status(400).json({ error: 'Invalid file type' })

    // Stream buffer to Cloudinary
    const uploadRes = await uploadReelStream({ buffer: file.buffer }, { folder: `reels/${product_id}` })

    // store metadata
    const r = await query(
      `INSERT INTO product_reels (product_id, user_id, cloudinary_public_id, cloudinary_url, caption, duration_seconds, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_id, userId, uploadRes.public_id, uploadRes.secure_url, caption || null, Math.floor(uploadRes.duration) || null, visibility || 'public']
    )

    try {
      const { query: dbq } = await import('../db.js')
      cache.refresh(dbq).catch(e => console.warn('Cache refresh (post-upload) failed', e && e.message))
    } catch (err) {
      console.warn('Cache refresh (import) failed', err && err.message)
    }
    res.json({ reel: r.rows[0] })
  } catch (err) {
    console.error('Upload reel failed', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// GET /api/reels?product_id=&page=&limit=
// Public endpoint: returns reels for a product or personalized feed for authenticated users (followed shops),
// otherwise returns a global recent reels feed.
router.get('/', async (req, res) => {
  try {
    const productId = req.query.product_id
    const limit = Math.min(50, Number.parseInt(req.query.limit || '12', 10))
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10))
    const offset = (page - 1) * limit

    // basic feed by product_id or global by followed shops (example)
    if (productId) {
      const r = await query(
  `SELECT pr.*, p.title AS product_title, s.id as shop_id, s.name as shop_name, s.domain as shop_domain, s.logo_url as shop_logo, u.id as uploader_id, u.display_name AS uploader_name
         FROM product_reels pr
         JOIN products p ON p.id = pr.product_id
         JOIN shops s ON s.owner_id = p.seller_id
         LEFT JOIN users u ON u.id = pr.user_id
         WHERE pr.product_id = $1 AND pr.is_active = true
         ORDER BY pr.created_at DESC
         LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      )
      const totalRes = await query('SELECT COUNT(*)::int AS count FROM product_reels WHERE product_id = $1 AND is_active = true', [productId])
      return res.json({ items: r.rows, total: Number(totalRes.rows[0]?.count || 0), page, limit })
    }

    // If user authenticated, try to return reels from followed shops; otherwise return global recent reels
    let shopIds = []
    try {
      if (req.user && req.user.id) {
        const sf = await query('SELECT shop_id FROM shop_follows WHERE user_id = $1', [req.user.id])
        shopIds = sf.rows.map(r => r.shop_id)
      }
    } catch (err) {
      console.warn('Failed to load followed shops', err && err.message)
    }

    // If we have followed shops, attempt to serve from cache keyed by followed shop ids
    if (shopIds.length > 0) {
      const cacheKey = `reels:shops:${shopIds.join(',')}:page:${page}:limit:${limit}`
      const cached = reelCache.getCache(cacheKey)
      if (cached) {
        res.setHeader('X-Cache', 'HIT')
        return res.json({ ...cached, cached: true })
      }

      const r = await query(
  `SELECT pr.*, p.title AS product_title, s.id as shop_id, s.name as shop_name, s.domain as shop_domain, s.logo_url as shop_logo, u.id as uploader_id, u.display_name AS uploader_name
         FROM product_reels pr
         JOIN products p ON p.id = pr.product_id
         JOIN shops s ON s.owner_id = p.seller_id
         LEFT JOIN users u ON u.id = pr.user_id
         WHERE s.id = ANY($1::uuid[]) AND pr.is_active = true
         ORDER BY pr.created_at DESC
         LIMIT $2 OFFSET $3`,
        [shopIds, limit, offset]
      )

      const totalRes = await query(
        `SELECT COUNT(*)::int AS count
         FROM product_reels pr
         JOIN products p ON p.id = pr.product_id
         JOIN shops s ON s.owner_id = p.seller_id
         WHERE s.id = ANY($1::uuid[]) AND pr.is_active = true`,
        [shopIds]
      )

      const payload = { items: r.rows, total: Number(totalRes.rows[0]?.count || 0), page, limit }
      try {
        reelCache.setCache(cacheKey, payload, 15 * 1000)
      } catch (e) {
        console.warn('Failed to set reel cache', e && e.message)
      }
      res.setHeader('X-Cache', 'MISS')
      return res.json({ ...payload, cached: false })
    }

    // No followed shops or unauthenticated: return a global recent public reels feed
    const r = await query(
  `SELECT pr.*, p.title AS product_title, s.id as shop_id, s.name as shop_name, s.domain as shop_domain, s.logo_url as shop_logo, u.id as uploader_id, u.display_name AS uploader_name
       FROM product_reels pr
       JOIN products p ON p.id = pr.product_id
       JOIN shops s ON s.owner_id = p.seller_id
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE pr.is_active = true
       ORDER BY pr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const totalRes = await query('SELECT COUNT(*)::int AS count FROM product_reels WHERE is_active = true')
    return res.json({ items: r.rows, total: Number(totalRes.rows[0]?.count || 0), page, limit })
  } catch (err) {
    console.error('Failed to list reels', err)
    res.status(500).json({ error: 'Failed to list reels' })
  }
})

// GET /api/reels/:id (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const r = await query(
      `SELECT pr.*, p.title AS product_title, s.id as shop_id, s.name as shop_name, s.logo_url as shop_logo, u.id as uploader_id, u.display_name AS uploader_name
       FROM product_reels pr
       JOIN products p ON p.id = pr.product_id
       JOIN shops s ON s.owner_id = p.seller_id
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE pr.id = $1`,
      [id]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const reel = r.rows[0]
    const commentsCountRes = await query('SELECT COUNT(*)::int AS count FROM reel_comments WHERE reel_id = $1 AND is_active = true', [id])
    const likesCountRes = await query('SELECT COUNT(*)::int AS count FROM reel_likes WHERE reel_id = $1', [id])
    res.json({ reel, comments: Number(commentsCountRes.rows[0]?.count || 0), likes: Number(likesCountRes.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to fetch reel', err)
    res.status(500).json({ error: 'Failed to fetch reel' })
  }
})

// POST /api/reels/:id/like -> toggle
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const exists = await query('SELECT 1 FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [id, userId])
    if (exists.rowCount > 0) {
      await query('DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [id, userId])
      const cnt = await query('SELECT COUNT(*)::int AS count FROM reel_likes WHERE reel_id = $1', [id])
      return res.json({ liked: false, count: Number(cnt.rows[0]?.count || 0) })
    }
    await query('INSERT INTO reel_likes (reel_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, userId])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM reel_likes WHERE reel_id = $1', [id])
    res.json({ liked: true, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Like reel failed', err)
    res.status(500).json({ error: 'Like failed' })
  }
})

// POST /api/reels/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { body, parent_comment_id } = req.body
    if (!body || String(body).trim() === '') return res.status(400).json({ error: 'Comment body required' })
    const r = await query('INSERT INTO reel_comments (reel_id, user_id, parent_comment_id, body) VALUES ($1,$2,$3,$4) RETURNING *', [id, req.user.id, parent_comment_id || null, body])
    res.json({ comment: r.rows[0] })
  } catch (err) {
    console.error('Add comment failed', err)
    res.status(500).json({ error: 'Add comment failed' })
  }
})

// DELETE /api/reels/:id -> soft delete by owner or admin
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const r = await query('SELECT pr.*, p.seller_id FROM product_reels pr JOIN products p ON p.id = pr.product_id WHERE pr.id = $1', [id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    const reel = r.rows[0]
    if (String(reel.seller_id) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    await query('UPDATE product_reels SET is_active = false WHERE id = $1', [id])
    try {
      const { query: dbq } = await import('../db.js')
      cache.refresh(dbq).catch(e => console.warn('Cache refresh (post-delete) failed', e && e.message))
    } catch (err) {
      console.warn('Cache refresh (import) failed', err && err.message)
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Delete reel failed', err)
    res.status(500).json({ error: 'Delete failed' })
  }
})

export default router
