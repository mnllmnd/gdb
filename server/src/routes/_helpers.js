import pool from '../db.js';

/**
 * MIGRATION HELPER: Convert owner identification (old phone → new ID)
 * 
 * During migration (Phase 4), the system accepts BOTH:
 * - Old format: x-owner header with phone number (TEXT)
 * - New format: x-owner-id header with integer ID
 * 
 * This function standardizes both to the new owner_id format.
 */
async function getOwnerId(req) {
  // Try new format first (x-owner-id: integer)
  const owner_id = parseInt(req.headers['x-owner-id']);
  if (owner_id && owner_id > 0) {
    return owner_id;
  }

  // Fall back to old format (x-owner: phone string)
  const owner_phone = req.headers['x-owner'] || req.headers['X-Owner'];
  if (owner_phone) {
    try {
      const result = await pool.query(
        'SELECT id FROM owners_new WHERE phone = $1 LIMIT 1',
        [owner_phone]
      );
      if (result.rowCount > 0) {
        return result.rows[0].id;
      }
    } catch (err) {
      console.error('Error mapping owner_phone to owner_id:', err);
    }
  }

  // If neither works, return null (will be handled by route)
  return null;
}

/**
 * Get owner phone from either format
 * Used during transition period for logging and activity tracking
 */
async function getOwnerPhone(req) {
  // Try old format first
  const owner_phone = req.headers['x-owner'] || req.headers['X-Owner'];
  if (owner_phone) {
    return owner_phone;
  }

  // Fall back to new format
  const owner_id = parseInt(req.headers['x-owner-id']);
  if (owner_id && owner_id > 0) {
    try {
      const result = await pool.query(
        'SELECT phone FROM owners_new WHERE id = $1 LIMIT 1',
        [owner_id]
      );
      if (result.rowCount > 0) {
        return result.rows[0].phone;
      }
    } catch (err) {
      console.error('Error getting phone for owner_id:', err);
    }
  }

  return null;
}

/**
 * Log request for debugging dual-mode migration
 * Shows which format (old/new) was used
 */
function logRequest(req, action) {
  const owner_id = req.headers['x-owner-id'];
  const owner_phone = req.headers['x-owner'] || req.headers['X-Owner'];
  const format = owner_id ? 'NEW (x-owner-id)' : (owner_phone ? 'OLD (x-owner)' : 'NONE');
  
  console.log(`[${action}] Format: ${format}, owner_id: ${owner_id || 'N/A'}, phone: ${owner_phone || 'N/A'}`);
}

export { getOwnerId, getOwnerPhone, logRequest };
