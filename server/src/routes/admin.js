import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

router.get('/users', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  try {
    const r = await query('SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC')
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed' })
  }
})

router.post('/users/:id/role', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const { id } = req.params
  const { role } = req.body
  try {
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
