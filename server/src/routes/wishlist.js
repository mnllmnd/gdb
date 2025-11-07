import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Obtenir la wishlist de l'utilisateur
router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await query(
      `SELECT p.* FROM wishlists w 
       JOIN products p ON p.id = w.product_id 
       WHERE w.user_id = $1 
       ORDER BY w.created_at DESC`,
      [req.user.id]
    )
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch wishlist', err)
    res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
})

// Ajouter un produit à la wishlist
router.post('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    )
    const count = await query(
      'SELECT COUNT(*)::int AS count FROM wishlists WHERE product_id = $1',
      [id]
    )
    res.json({ added: true, count: Number(count.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to add to wishlist', err)
    res.status(500).json({ error: 'Failed to add to wishlist' })
  }
})

// Retirer un produit de la wishlist
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, id]
    )
    const count = await query(
      'SELECT COUNT(*)::int AS count FROM wishlists WHERE product_id = $1',
      [id]
    )
    res.json({ removed: true, count: Number(count.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to remove from wishlist', err)
    res.status(500).json({ error: 'Failed to remove from wishlist' })
  }
})

// Vérifier si un produit est dans la wishlist
router.get('/:id/check', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    const r = await query(
      'SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, id]
    )
    const count = await query(
      'SELECT COUNT(*)::int AS count FROM wishlists WHERE product_id = $1',
      [id]
    )
    res.json({ 
      inWishlist: r.rowCount > 0,
      count: Number(count.rows[0]?.count || 0)
    })
  } catch (err) {
    console.error('Failed to check wishlist status', err)
    res.status(500).json({ error: 'Failed to check wishlist status' })
  }
})

export default router