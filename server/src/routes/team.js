import express from 'express';
import pool from '../db.js';
import { getOwnerId, logRequest } from './_helpers.js';

const router = express.Router();

function getOwnerPhone(req) {
  return req.header('x-owner') || process.env.BOUTIQUE_OWNER || null;
}

// List members of the shop
// MIGRATION: Uses owner_id instead of owner_phone
router.get('/members', async (req, res) => {
  const owner_id = await getOwnerId(req);
  if (!owner_id) {
    logRequest(req, 'GET /team/members[ERROR]');
    return res.status(400).json({ error: 'Missing owner identification' });
  }
  
  logRequest(req, 'GET /team/members');
  
  try {
    const q = `SELECT u.id, u.phone, u.name, su.role, su.added_at FROM shop_users su JOIN users u ON u.id = su.user_id WHERE su.owner_id = $1 ORDER BY su.added_at DESC`;
    const { rows } = await pool.query(q, [owner_id]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Invite/add a member to the shop
// MIGRATION: Uses owner_id instead of owner_phone
router.post('/invite', async (req, res) => {
  const owner_id = await getOwnerId(req);
  if (!owner_id) {
    logRequest(req, 'POST /team/invite[ERROR]');
    return res.status(400).json({ error: 'Missing owner identification' });
  }
  
  const { phone, name, role } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  
  logRequest(req, 'POST /team/invite');
  
  try {
    // create user if not exists
    const exist = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    let userId;
    if (exist.rows.length > 0) {
      userId = exist.rows[0].id;
      // optionally update name
      if (name) await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
    } else {
      const ins = await pool.query('INSERT INTO users(phone, name) VALUES($1,$2) RETURNING id, phone, name', [phone, name || null]);
      userId = ins.rows[0].id;
    }

    // add to shop_users with owner_id
    await pool.query(
      `INSERT INTO shop_users(owner_id, user_id, role) VALUES($1,$2,$3) ON CONFLICT (owner_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [owner_id, userId, role || 'clerk']
    );

    // log activity
    await pool.query(
      'INSERT INTO activity_log(owner_id, user_id, action, details) VALUES($1,$2,$3,$4)',
      [owner_id, userId, 'invite_member', JSON.stringify({ phone, role })]
    );

    const member = await pool.query(
      'SELECT u.id, u.phone, u.name, su.role, su.added_at FROM shop_users su JOIN users u ON u.id = su.user_id WHERE su.owner_id = $1 AND u.id = $2',
      [owner_id, userId]
    );
    return res.status(201).json(member.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Update member role
// MIGRATION: Uses owner_id instead of owner_phone
router.put('/members/:id', async (req, res) => {
  const owner_id = await getOwnerId(req);
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  if (!owner_id) {
    logRequest(req, 'PUT /team/members/:id[ERROR]');
    return res.status(400).json({ error: 'Missing owner identification' });
  }
  
  logRequest(req, 'PUT /team/members/:id');
  
  try {
    await pool.query('UPDATE shop_users SET role = $1 WHERE owner_id = $2 AND user_id = $3', [role, owner_id, userId]);
    await pool.query(
      'INSERT INTO activity_log(owner_id, user_id, action, details) VALUES($1,$2,$3,$4)',
      [owner_id, userId, 'update_role', JSON.stringify({ role })]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Remove member from shop
// MIGRATION: Uses owner_id instead of owner_phone
router.delete('/members/:id', async (req, res) => {
  const owner_id = await getOwnerId(req);
  const userId = parseInt(req.params.id);
  if (!owner_id) {
    logRequest(req, 'DELETE /team/members/:id[ERROR]');
    return res.status(400).json({ error: 'Missing owner identification' });
  }
  
  logRequest(req, 'DELETE /team/members/:id');
  
  try {
    await pool.query('DELETE FROM shop_users WHERE owner_id = $1 AND user_id = $2', [owner_id, userId]);
    await pool.query(
      'INSERT INTO activity_log(owner_id, user_id, action, details) VALUES($1,$2,$3,$4)',
      [owner_id, userId, 'remove_member', JSON.stringify({})]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Get activity log for shop
// MIGRATION: Uses owner_id instead of owner_phone
router.get('/activity', async (req, res) => {
  const owner_id = await getOwnerId(req);
  if (!owner_id) {
    logRequest(req, 'GET /team/activity[ERROR]');
    return res.status(400).json({ error: 'Missing owner identification' });
  }
  
  logRequest(req, 'GET /team/activity');
  
  try {
    const q = 'SELECT id, user_id, action, details, created_at FROM activity_log WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 200';
    const { rows } = await pool.query(q, [owner_id]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Append arbitrary activity (optional)
router.post('/activity', async (req, res) => {
  const owner = getOwnerPhone(req);
  const { user_id, action, details } = req.body;
  if (!owner) return res.status(400).json({ error: 'Missing owner header' });
  if (!action) return res.status(400).json({ error: 'action required' });
  try {
    const ins = await pool.query('INSERT INTO activity_log(owner_phone, user_id, action, details) VALUES($1,$2,$3,$4) RETURNING id, created_at', [owner, user_id || null, action, details ? JSON.stringify(details) : null]);
    return res.status(201).json(ins.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

export default router;
