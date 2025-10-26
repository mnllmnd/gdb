import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../db.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  // Accept phone + password for simpler signup. Email is optional.
  const { email, phone, password, displayName, role } = req.body
  if (!phone || !password) return res.status(400).json({ error: 'Missing phone or password' })
  const hash = await bcrypt.hash(password, 10)
  try {
    // check if phone or email already exists to give a friendly error
    if (phone) {
      const exists = await query('SELECT id FROM users WHERE phone = $1', [phone])
      if (exists.rowCount > 0) return res.status(409).json({ error: 'Phone already registered' })
    }
    if (email) {
      const existsEmail = await query('SELECT id FROM users WHERE email = $1', [email])
      if (existsEmail.rowCount > 0) return res.status(409).json({ error: 'Email already registered' })
    }

    const insert = await query(
      'INSERT INTO users (email, phone, password_hash, display_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, phone, display_name, role',
      [email || null, phone, hash, displayName || null, role || 'client']
    )
    const user = insert.rows[0]
    const token = generateToken({ id: user.id, phone: user.phone, role: user.role })
    res.json({ user, token })
  } catch (err) {
    console.error(err)
    // if a unique constraint slipped through, return 409
    if (err && err.code === '23505') return res.status(409).json({ error: 'User already exists' })
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  // Login via phone + password (simpler for non-technophiles). Email optional.
  const { phone, password } = req.body
  console.log('POST /auth/login body:', { phone: req.body.phone ? '***' : undefined })
  if (!phone || !password) return res.status(400).json({ error: 'Missing phone or password' })
  try {
    const find = await query('SELECT id, email, phone, password_hash, display_name, role FROM users WHERE phone = $1', [phone])
    if (find.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = find.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = generateToken({ id: user.id, phone: user.phone, role: user.role })
    res.json({ user: { id: user.id, email: user.email, phone: user.phone, display_name: user.display_name, role: user.role }, token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Return liked products for current user
router.get('/me/likes', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT p.* FROM likes l JOIN products p ON p.id = l.product_id WHERE l.user_id = $1 ORDER BY l.created_at DESC', [req.user.id])
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch liked products', err)
    res.status(500).json({ error: 'Failed to fetch likes' })
  }
})

// Follow a user
router.post('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    // ensure target user exists
    const u = await query('SELECT id FROM users WHERE id = $1', [id])
    if (u.rowCount === 0) return res.status(404).json({ error: 'User not found' })
    if (String(id) === String(req.user.id)) return res.status(400).json({ error: 'Cannot follow yourself' })
    await query('INSERT INTO user_follows (follower_id, followed_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM user_follows WHERE followed_user_id = $1', [id])
    res.json({ followed: true, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to follow user', err)
    res.status(500).json({ error: 'Failed to follow' })
  }
})

// Unfollow a user
router.delete('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params
  try {
    await query('DELETE FROM user_follows WHERE follower_id = $1 AND followed_user_id = $2', [req.user.id, id])
    const cnt = await query('SELECT COUNT(*)::int AS count FROM user_follows WHERE followed_user_id = $1', [id])
    res.json({ followed: false, count: Number(cnt.rows[0]?.count || 0) })
  } catch (err) {
    console.error('Failed to unfollow user', err)
    res.status(500).json({ error: 'Failed to unfollow' })
  }
})

// Get followers of a user
router.get('/:id/followers', async (req, res) => {
  const { id } = req.params
  try {
    const cnt = await query('SELECT COUNT(*)::int AS count FROM user_follows WHERE followed_user_id = $1', [id])
    const rows = await query('SELECT u.id, u.display_name, u.email FROM user_follows uf JOIN users u ON u.id = uf.follower_id WHERE uf.followed_user_id = $1 ORDER BY uf.created_at DESC LIMIT 50', [id])
    res.json({ count: Number(cnt.rows[0]?.count || 0), users: rows.rows })
  } catch (err) {
    console.error('Failed to fetch followers', err)
    res.status(500).json({ error: 'Failed to fetch followers' })
  }
})

// Get users the current user is following
router.get('/me/following', authenticate, async (req, res) => {
  try {
    const r = await query('SELECT u.id, u.display_name, u.email FROM user_follows uf JOIN users u ON u.id = uf.followed_user_id WHERE uf.follower_id = $1 ORDER BY uf.created_at DESC', [req.user.id])
    res.json(r.rows)
  } catch (err) {
    console.error('Failed to fetch following list', err)
    res.status(500).json({ error: 'Failed to fetch following' })
  }
})

export default router
