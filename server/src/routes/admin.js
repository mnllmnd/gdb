import express from 'express'
import { query } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import cache from '../cache.js'
import tfidf from '../tfidf_cache.js' // Correction du chemin d'import
import dotenv from 'dotenv'
dotenv.config()
import fs from 'fs'
import path from 'path'

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
    res.status(500).json({ error: 'Failed to update user role' })
  }
})

// Delete a user and all associated data
router.delete('/users/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const { id } = req.params
  
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' })
  }

  try {
    // Start a transaction to ensure data consistency
    await query('BEGIN')
    
    // First check if user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userCheck.rowCount === 0) {
      await query('ROLLBACK')
      return res.status(404).json({ error: 'User not found' })
    }

    // Get all products by the user to handle order dependencies
    const userProducts = await query('SELECT id FROM products WHERE seller_id = $1', [id])
    const productIds = userProducts.rows.map(p => p.id)

    // Delete orders associated with user's products
    if (productIds.length > 0) {
      await query('DELETE FROM orders WHERE product_id = ANY($1)', [productIds])
    }

    // Delete orders made by the user
    await query('DELETE FROM orders WHERE buyer_id = $1', [id])

    // Delete all products by the user
    await query('DELETE FROM products WHERE seller_id = $1', [id])

    // Delete user's shop (this will cascade due to ON DELETE CASCADE)
    await query('DELETE FROM shops WHERE owner_id = $1', [id])
    
    // Finally delete the user
    await query('DELETE FROM users WHERE id = $1', [id])
    
    await query('COMMIT')
    res.json({ success: true, message: 'User and associated data deleted successfully' })
  } catch (err) {
    await query('ROLLBACK')
    console.error('Error deleting user:', err)
    res.status(500).json({ error: err.message || 'Failed to delete user' })
  }
})

// Admin: force cache refresh (protected)
router.post('/cache/refresh', async (req, res) => {
  // Allow either authenticated admin users or a valid ADMIN_TOKEN header for out-of-band access
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.body?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    const { query: dbQuery } = await import('../db.js')
    await cache.refresh(dbQuery)
    return res.json({ success: true, message: 'Cache refreshed' })
  } catch (err) {
    console.error('Cache refresh failed (admin):', err)
    return res.status(500).json({ error: 'Cache refresh failed', details: err.message })
  }
})

// Admin: inspect current cache (counts)
router.get('/cache', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.query?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    const products = cache.getProducts()
    const shops = cache.getShops()
    const categories = cache.getCategories()
    return res.json({ products: products.length, shops: shops.length, categories: categories.length })
  } catch (err) {
    console.error('Failed to inspect cache:', err)
    return res.status(500).json({ error: 'Failed to inspect cache' })
  }
})

// Admin: delete persisted snapshot file and refresh from DB
router.post('/cache/clear-snapshot', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.body?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    const cacheFile = path.resolve(process.cwd(), 'server', 'data', 'cache_snapshot.json')
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile)
      console.log('Admin: cache snapshot file removed')
    }
    const { query: dbQuery } = await import('../db.js')
    const refreshed = await cache.refresh(dbQuery)
    if (!refreshed) return res.status(500).json({ error: 'Failed to refresh cache after clearing snapshot' })
    return res.json({ success: true, message: 'Snapshot cleared and cache refreshed' })
  } catch (err) {
    console.error('Failed to clear snapshot and refresh cache:', err)
    return res.status(500).json({ error: 'Failed to clear snapshot and refresh cache', details: err.message })
  }
})

// Admin: verify DB counts vs in-memory cache counts
router.get('/cache/verify', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.query?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    // Query DB for counts
    const p = await query('SELECT COUNT(*)::int AS count FROM products')
    const s = await query('SELECT COUNT(*)::int AS count FROM shops')
    const c = await query('SELECT COUNT(*)::int AS count FROM categories')
    const dbCounts = { products: Number(p.rows[0]?.count || 0), shops: Number(s.rows[0]?.count || 0), categories: Number(c.rows[0]?.count || 0) }

    const cacheProducts = cache.getProducts() || []
    const cacheShops = cache.getShops() || []
    const cacheCategories = cache.getCategories() || []
    const cacheCounts = { products: cacheProducts.length, shops: cacheShops.length, categories: cacheCategories.length }

    return res.json({ db: dbCounts, cache: cacheCounts, match: (dbCounts.products === cacheCounts.products && dbCounts.shops === cacheCounts.shops && dbCounts.categories === cacheCounts.categories) })
  } catch (err) {
    console.error('Failed to verify cache vs DB:', err)
    return res.status(500).json({ error: 'Failed to verify cache vs DB', details: err.message })
  }
})

// ✅ Route pour rafraîchir le cache TF-IDF
router.post('/tfidf/refresh', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.body?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    const success = await tfidf.forceRefresh()
    const cacheInfo = tfidf.getCacheInfo()
    
    if (success) {
      res.json({
        success: true,
        message: 'TF-IDF cache refreshed successfully',
        cacheInfo
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh TF-IDF cache',
        cacheInfo
      })
    }
  } catch (error) {
    console.error('TF-IDF cache refresh failed:', error)
    res.status(500).json({
      success: false,
      message: 'Error refreshing TF-IDF cache',
      error: error.message,
      cacheInfo: tfidf.getCacheInfo()
    })
  }
})

// ✅ Route pour voir l'état du cache TF-IDF
router.get('/tfidf/info', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.query?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    const cacheInfo = tfidf.getCacheInfo()
    res.json({
      success: true,
      cacheInfo
    })
  } catch (error) {
    console.error('Failed to get TF-IDF cache info:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting TF-IDF cache info',
      error: error.message
    })
  }
})

// ✅ Route pour vérifier la cohérence TF-IDF vs Base de données
router.get('/tfidf/verify', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN
  const providedToken = req.headers['x-admin-token'] || req.query?.admin_token
  let allowed = false
  if (req.user && req.user.role === 'admin') allowed = true
  if (!allowed && adminToken && providedToken && String(providedToken) === String(adminToken)) allowed = true
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  try {
    // Compter les produits dans la base de données (avec les mêmes critères)
    const dbResult = await query(`
      SELECT COUNT(*)::int AS count 
      FROM products 
      WHERE price IS NOT NULL 
        AND quantity > 0
    `)
    const dbCount = Number(dbResult.rows[0]?.count || 0)
    
    // Compter les produits dans le cache TF-IDF
    const tfidfProducts = tfidf.getProducts()
    const tfidfCount = tfidfProducts.length
    
    // Vérifier les IDs manquants
    const dbIdsResult = await query(`
      SELECT id 
      FROM products 
      WHERE price IS NOT NULL 
        AND quantity > 0
      ORDER BY id
    `)
    const dbIds = new Set(dbIdsResult.rows.map(row => row.id))
    const tfidfIds = new Set(tfidfProducts.map(p => p.id))
    
    const missingInTfidf = Array.from(dbIds).filter(id => !tfidfIds.has(id))
    const extraInTfidf = Array.from(tfidfIds).filter(id => !dbIds.has(id))
    
    const cacheInfo = tfidf.getCacheInfo()
    
    res.json({
      success: true,
      counts: {
        database: dbCount,
        tfidf: tfidfCount,
        match: dbCount === tfidfCount
      },
      discrepancies: {
        missingInTfidf,
        extraInTfidf,
        totalDiscrepancies: missingInTfidf.length + extraInTfidf.length
      },
      cacheInfo,
      criteria: "products with price NOT NULL and quantity > 0"
    })
  } catch (error) {
    console.error('TF-IDF verification failed:', error)
    res.status(500).json({
      success: false,
      message: 'Error verifying TF-IDF cache',
      error: error.message
    })
  }
})

export default router