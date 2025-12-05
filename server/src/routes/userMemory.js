import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Ensure table exists (best-effort)
async function ensureTable() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS user_memory (user_id bigint PRIMARY KEY, memory jsonb, updated_at timestamptz DEFAULT now())`)
  } catch (e) {
    console.warn('ensureTable user_memory failed', e.message)
  }
}

// GET /api/user/memory -> get memory for authenticated user
router.get('/memory', authenticate, async (req, res) => {
  try {
    await ensureTable()
    const r = await query('SELECT memory FROM user_memory WHERE user_id = $1 LIMIT 1', [req.user.id])
    return res.json({ memory: r.rows[0] ? r.rows[0].memory : {} })
  } catch (err) {
    console.error('user/memory GET failed', err.message)
    res.status(500).json({ error: 'Failed to get memory' })
  }
})

// POST /api/user/memory -> set memory for authenticated user (body: memory JSON)
router.post('/memory', authenticate, async (req, res) => {
  try {
    const memory = req.body.memory || {}
    await ensureTable()
    await query(
      `INSERT INTO user_memory (user_id, memory, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (user_id) DO UPDATE SET memory = EXCLUDED.memory, updated_at = now()`,
      [req.user.id, JSON.stringify(memory)]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('user/memory POST failed', err.message)
    res.status(500).json({ error: 'Failed to save memory' })
  }
})

export default router
