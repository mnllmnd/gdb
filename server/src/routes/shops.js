import express from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { authenticate, generateToken } from '../middleware/auth.js'
import cache from '../cache.js'

const router = express.Router()

// Create or update shop for seller
router.post('/', authenticate, async (req, res) => {
  const { shop_name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express } = req.body
  try {
    if (req.user.role !== 'seller') {
      await query('UPDATE users SET role = $1 WHERE id = $2', ['seller', req.user.id])
      const newToken = generateToken({ id: req.user.id, phone: req.user.phone, role: 'seller' })
      req.newToken = newToken
    }
    const existing = await query('SELECT * FROM shops WHERE owner_id = $1::uuid', [req.user.id])
    if (existing.rowCount > 0) {
      const updated = await query(
        `UPDATE shops 
         SET shop_name=$1, domain=$2, logo_url=$3, description=$4, delivery_price_local=$5, delivery_price_regional=$6, delivery_price_express=$7 
         WHERE owner_id=$8::uuid RETURNING *`,
        [
          shop_name ?? existing.rows[0].shop_name,
          domain ?? existing.rows[0].domain,
          logo_url ?? existing.rows[0].logo_url,
          description ?? existing.rows[0].description,
          delivery_price_local ?? existing.rows[0].delivery_price_local,
          delivery_price_regional ?? existing.rows[0].delivery_price_regional,
          delivery_price_express ?? existing.rows[0].delivery_price_express,
          req.user.id,
        ]
      )
      const out = updated.rows[0]
      res.json(req.newToken ? { ...out, token: req.newToken } : out)
      try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after shop update failed', e.message) }
      return
    }

    const r = await query(
      `INSERT INTO shops (owner_id, shop_name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.user.id,
        shop_name ?? null,
        domain ?? null,
        logo_url ?? null,
        description ?? null,
        delivery_price_local ?? null,
        delivery_price_regional ?? null,
        delivery_price_express ?? null,
      ]
    )
    const out = r.rows[0]
    res.json(req.newToken ? { ...out, token: req.newToken } : out)
    try { const { query: dbQuery } = await import('../db.js'); cache.refresh(dbQuery) } catch (e) { console.warn('Cache refresh after shop create failed', e.message) }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save shop' })
  }
})

// Get shop for current seller
router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT * FROM shops WHERE owner_id = $1::uuid', [req.user.id])
    if (r.rowCount === 0) return res.status(404).json({ error: 'No shop' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

// Public: list shops (with shop_name alias for front)
router.get('/', async (req, res) => {
  try {
    console.debug('[GET /shops] fetching shops list')
    const cached = cache.getShops()
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.debug('[GET /shops] returning', cached.length, 'shops from cache')
      return res.json(cached)
    }

    console.debug('[GET /shops] cache empty, querying database')
    const r = await query(
      `SELECT id, owner_id, shop_name AS name, domain, logo_url, description, delivery_price_local, delivery_price_regional, delivery_price_express, created_at 
       FROM shops ORDER BY created_at DESC`
    )
    console.debug('[GET /shops] returned', r.rowCount, 'shops')
    res.json(r.rows || [])
  } catch (err) {
    console.error('[GET /shops] ERROR:', err.message, 'stack:', err.stack)
    res.status(500).json({ error: 'Failed to list shops' })
  }
})

// Public: popular shops
router.get('/popular', async (req, res) => {
  try {
    const r = await query(
      `SELECT s.id, s.owner_id, s.shop_name AS name, s.domain, s.logo_url, s.description, s.delivery_price_local, s.delivery_price_regional, s.delivery_price_express, 
              COUNT(sf.user_id)::int AS followers
       FROM shops s
       LEFT JOIN shop_follows sf ON sf.shop_id = s.id
       GROUP BY s.id, s.owner_id, s.shop_name, s.domain, s.logo_url, s.description, s.delivery_price_local, s.delivery_price_regional, s.delivery_price_express
       ORDER BY followers DESC, s.created_at DESC
       LIMIT 12`
    )
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch popular shops', err)
    res.status(500).json({ error: 'Failed to fetch popular shops' })
  }
})

// Public: search shops by shop_name or product title
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    if (!q) return res.json([])
    const parts = q.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return res.json([])

    const whereClauses = parts.map((_, idx) => `(s.shop_name ILIKE $${idx + 1} OR p.title ILIKE $${idx + 1})`).join(' OR ')
    const params = parts.map(p => `%${p}%`)
    const r = await query(
      `SELECT DISTINCT s.id, s.owner_id, s.shop_name AS name, s.domain, s.logo_url, s.description, s.delivery_price_local, s.delivery_price_regional, s.delivery_price_express, s.created_at
       FROM shops s
       LEFT JOIN products p ON p.seller_id = s.owner_id
       WHERE ${whereClauses}
       ORDER BY s.created_at DESC`,
      params
    )
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to search shops' })
  }
})
// Delete shop by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la boutique appartient au user
    const existing = await query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Shop not found or not yours' });
    }

    await query('DELETE FROM shops WHERE id = $1', [id]);

    // Optional: nettoyer le cache
    try {
      const { query: dbQuery } = await import('../db.js');
      cache.refresh(dbQuery);
    } catch (e) {
      console.warn('Cache refresh after shop delete failed', e.message);
    }

    res.json({ success: true, message: 'Shop deleted successfully' });
  } catch (err) {
    console.error('DELETE /shops/:id', err);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});


export default router
