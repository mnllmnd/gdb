import express from 'express'
import cache from '../cache.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { query } from '../db.js'

const router = express.Router()

// Route pour forcer le rafraîchissement du cache
router.post('/refresh', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await cache.refresh(query, true) // force=true
    res.json({ success: true, message: 'Cache refreshed successfully' })
  } catch (error) {
    console.error('Cache refresh failed:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error refreshing cache',
      error: error.message 
    })
  }
})

// Route pour obtenir l'état du cache
router.get('/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const status = cache.getStatus()
    res.json({ success: true, status })
  } catch (error) {
    console.error('Failed to get cache status:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting cache status',
      error: error.message
    })
  }
})

export default router