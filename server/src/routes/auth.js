import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../db.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = express.Router()

// Simple in-memory rate limiter to mitigate brute-force on login
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCK_TIME_MS = 15 * 60 * 1000 // 15 minutes

const attemptsByIp = new Map()
const attemptsByUser = new Map()

function cleanupAttempts(map) {
  const now = Date.now()
  for (const [k, v] of map.entries()) {
    if (v.lockedUntil && v.lockedUntil <= now) {
      map.delete(k)
      continue
    }
    // prune old timestamps
    if (Array.isArray(v.ts)) {
      v.ts = v.ts.filter(t => now - t <= WINDOW_MS)
      if (v.ts.length === 0 && !v.lockedUntil) map.delete(k)
    }
  }
}

function isBlocked(map, key) {
  const rec = map.get(key)
  if (!rec) return false
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true
  if (Array.isArray(rec.ts) && rec.ts.length >= MAX_ATTEMPTS) {
    // lock
    rec.lockedUntil = Date.now() + LOCK_TIME_MS
    return true
  }
  return false
}

function recordAttempt(map, key) {
  const now = Date.now()
  const rec = map.get(key) || { ts: [], lockedUntil: null }
  rec.ts = (rec.ts || []).filter(t => now - t <= WINDOW_MS)
  rec.ts.push(now)
  if (rec.ts.length >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_TIME_MS
  }
  map.set(key, rec)
}

function resetAttempts(map, key) {
  map.delete(key)
}

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
  // Run simple rate-limit checks
  try {
    cleanupAttempts(attemptsByIp)
    cleanupAttempts(attemptsByUser)
  } catch (e) { /* ignore cleanup errors */ }

  const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown').toString()
  if (isBlocked(attemptsByIp, ip)) {
    return res.status(429).json({ error: 'Too many attempts from this IP, try again later' })
  }
  if (isBlocked(attemptsByUser, phone)) {
    return res.status(429).json({ error: 'Too many attempts for this account, try again later' })
  }
  try {
    const find = await query('SELECT id, email, phone, password_hash, display_name, role FROM users WHERE phone = $1', [phone])
    if (find.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = find.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = generateToken({ id: user.id, phone: user.phone, role: user.role })
    // successful login -> reset attempts
    resetAttempts(attemptsByIp, ip)
    resetAttempts(attemptsByUser, phone)
    res.json({ user: { id: user.id, email: user.email, phone: user.phone, display_name: user.display_name, role: user.role }, token })
  } catch (err) {
    // record failed attempt
    try {
      recordAttempt(attemptsByIp, ip)
      recordAttempt(attemptsByUser, phone)
    } catch (e) { /* ignore recording errors */ }
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
