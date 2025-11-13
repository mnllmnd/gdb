import express from 'express'
import dotenv from 'dotenv'
import PasswordResetService from '../services/passwordReset.js'
import { query } from '../db.js'
dotenv.config()

const router = express.Router()

// POST /api/debug/test-email
// Body: { email }
// Allowed when NODE_ENV==='development' OR valid ADMIN_TOKEN header is provided
router.post('/test-email', async (req, res) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN
    const provided = req.headers['x-admin-token'] || req.body?.admin_token
    const allowed = process.env.NODE_ENV === 'development' || (adminToken && provided && String(provided) === String(adminToken))
    if (!allowed) return res.status(403).json({ error: 'Forbidden. Provide ADMIN_TOKEN or run in development mode.' })

    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'email is required in body' })

    // If the email belongs to a user, create a real reset token persisted to DB so the link works.
    // Otherwise generate a non-persisted token and send the link (useful for testing addresses not in DB).
    const userRes = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    let token
    if (userRes.rowCount > 0) {
      const userId = userRes.rows[0].id
      token = await PasswordResetService.createResetToken(userId)
    } else {
      // generate a token but do not persist
      token = PasswordResetService.generateToken()
    }

    const origin = req.body.origin || (`http://${req.get('host')}`)
    const result = await PasswordResetService.sendResetEmail(email, token, origin)
    res.json({ success: true, result })
  } catch (err) {
    console.error('Test email route error:', err)
    res.status(500).json({ error: err?.message || String(err) })
  }
})

export default router
