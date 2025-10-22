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

export default router
