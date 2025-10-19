import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../db.js'
import { generateToken } from '../middleware/auth.js'

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

export default router
