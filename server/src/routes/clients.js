import express from 'express';
import pool from '../db.js';
import { getOwnerId, logRequest } from './_helpers.js';

const router = express.Router();

// Fonction helper pour calculer le solde correct (identique à debts.js)
async function calculateDebtBalance(debtId) {
  const debtRes = await pool.query('SELECT amount FROM debts WHERE id=$1', [debtId]);
  if (debtRes.rowCount === 0) return null;
  
  const baseAmount = parseFloat(debtRes.rows[0].amount);
  
  const additionsRes = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM debt_additions WHERE debt_id=$1', [debtId]);
  const totalAdditions = parseFloat(additionsRes.rows[0].total);
  
  const paymentsRes = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE debt_id=$1', [debtId]);
  const totalPayments = parseFloat(paymentsRes.rows[0].total);
  
  return {
    base_amount: baseAmount,
    total_additions: totalAdditions,
    total_payments: totalPayments,
    total_debt: baseAmount + totalAdditions,
    remaining: Math.max((baseAmount + totalAdditions) - totalPayments, 0)
  };
}

// List clients with their total debt information
// MIGRATION: Accepts both x-owner (old) and x-owner-id (new) headers
router.get('/', async (req, res) => {
  try {
    const owner_id = await getOwnerId(req);
    if (!owner_id) {
      logRequest(req, 'GET /clients[ERROR]');
      return res.status(400).json({ error: 'Missing or invalid owner identification' });
    }
    
    logRequest(req, 'GET /clients');
    
    // Query using owner_id (new format) instead of owner_phone
    const clientsRes = await pool.query(
      'SELECT * FROM clients WHERE owner_id = $1 ORDER BY id DESC',
      [owner_id]
    );
    
    const clientsWithDebts = [];
    for (const client of clientsRes.rows) {
      // Get all debts for this client
      const debtsRes = await pool.query(
        'SELECT * FROM debts WHERE client_id=$1 AND creditor_id=$2 ORDER BY id DESC', 
        [client.id, owner_id]
      );
      
      let totalDebt = 0;
      let totalPaid = 0;
      let totalRemaining = 0;
      let activeDebts = 0;
      
      for (const debt of debtsRes.rows) {
        const balance = await calculateDebtBalance(debt.id);
        totalDebt += balance.total_debt;
        totalPaid += balance.total_payments;
        totalRemaining += balance.remaining;
        
        if (balance.remaining > 0) {
          activeDebts++;
        }
      }
      
      clientsWithDebts.push({
        ...client,
        total_debt: totalDebt,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        active_debts_count: activeDebts,
        debts_count: debtsRes.rowCount
      });
    }
    
    res.json(clientsWithDebts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Create client
// MIGRATION: Uses owner_id instead of owner_phone
router.post('/', async (req, res) => {
  const { client_number, name, avatar_url } = req.body;
  
  try {
    const owner_id = await getOwnerId(req);
    if (!owner_id) {
      logRequest(req, 'POST /clients[ERROR]');
      return res.status(400).json({ error: 'Missing or invalid owner identification' });
    }
    
    logRequest(req, 'POST /clients');
    
    const result = await pool.query(
      'INSERT INTO clients (client_number, name, avatar_url, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_number, name, avatar_url, owner_id]
    );
    
    // log activity
    try {
      await pool.query(
        'INSERT INTO activity_log(owner_id, action, details) VALUES($1,$2,$3)',
        [owner_id, 'create_client', JSON.stringify({ client_id: result.rows[0].id, name: result.rows[0].name })]
      );
    } catch (e) { 
      console.error('Activity log error:', e); 
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get client with detailed debt information
// MIGRATION: Uses owner_id instead of owner_phone
router.get('/:id', async (req, res) => {
  try {
    const owner_id = await getOwnerId(req);
    if (!owner_id) {
      logRequest(req, 'GET /clients/:id[ERROR]');
      return res.status(400).json({ error: 'Missing or invalid owner identification' });
    }
    
    const clientRes = await pool.query(
      'SELECT * FROM clients WHERE id=$1 AND owner_id = $2',
      [req.params.id, owner_id]
    );
    if (clientRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    
    const client = clientRes.rows[0];
    logRequest(req, 'GET /clients/:id');
    
    // Get all debts for this client with detailed calculations
    const debtsRes = await pool.query(
      'SELECT * FROM debts WHERE client_id=$1 AND creditor_id=$2 ORDER BY id DESC', 
      [client.id, owner_id]
    );
    
    const debtsWithBalance = [];
    let totalDebt = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let activeDebts = 0;
    
    for (const debt of debtsRes.rows) {
      const balance = await calculateDebtBalance(debt.id);
      const debtWithBalance = {
        ...debt,
        total_paid: balance.total_payments,
        total_additions: balance.total_additions,
        total_debt: balance.total_debt,
        remaining: balance.remaining
      };
      
      debtsWithBalance.push(debtWithBalance);
      
      totalDebt += balance.total_debt;
      totalPaid += balance.total_payments;
      totalRemaining += balance.remaining;
      
      if (balance.remaining > 0) {
        activeDebts++;
      }
    }
    
    res.json({
      ...client,
      debts: debtsWithBalance,
      summary: {
        total_debt: totalDebt,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        active_debts_count: activeDebts,
        total_debts_count: debtsRes.rowCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { client_number, name, avatar_url } = req.body;
  try {
    const owner = req.headers['x-owner'] || req.headers['X-Owner'] || process.env.BOUTIQUE_OWNER || 'owner';
    
    // Verify ownership
    const checkRes = await pool.query('SELECT * FROM clients WHERE id=$1 AND owner_phone=$2', [id, owner]);
    if (checkRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    
    // Build update query dynamically
    let updateFields = [];
    let params = [];
    let paramIndex = 1;
    
    if (client_number !== undefined) {
      updateFields.push(`client_number=$${paramIndex++}`);
      params.push(client_number);
    }
    if (name !== undefined) {
      updateFields.push(`name=$${paramIndex++}`);
      params.push(name);
    }
    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url=$${paramIndex++}`);
      params.push(avatar_url);
    }
    
    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    params.push(id);
    const query = `UPDATE clients SET ${updateFields.join(', ')} WHERE id=$${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);
    
    // log activity
    try {
      await pool.query('INSERT INTO activity_log(owner_phone, action, details) VALUES($1,$2,$3)', [owner, 'update_client', JSON.stringify({ client_id: result.rows[0].id, name: result.rows[0].name })]);
    } catch (e) { console.error('Activity log error:', e); }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const owner = req.headers['x-owner'] || req.headers['X-Owner'] || process.env.BOUTIQUE_OWNER || 'owner';
    
    // First check if client has debts
    const debtsRes = await pool.query('SELECT COUNT(*) as debt_count FROM debts WHERE client_id=$1 AND creditor=$2', [req.params.id, owner]);
    const debtCount = parseInt(debtsRes.rows[0].debt_count);
    
    if (debtCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing debts', 
        debt_count: debtCount 
      });
    }
    
    const result = await pool.query('DELETE FROM clients WHERE id=$1 AND owner_phone = $2 RETURNING *', [req.params.id, owner]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    
    // log activity
    try {
      await pool.query('INSERT INTO activity_log(owner_phone, action, details) VALUES($1,$2,$3)', [owner, 'delete_client', JSON.stringify({ client_id: result.rows[0].id, name: result.rows[0].name })]);
    } catch (e) { console.error('Activity log error:', e); }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get client's debts only
router.get('/:id/debts', async (req, res) => {
  try {
    const owner = req.headers['x-owner'] || req.headers['X-Owner'] || process.env.BOUTIQUE_OWNER || 'owner';
    
    // Verify client exists and belongs to owner
    const clientRes = await pool.query('SELECT id FROM clients WHERE id=$1 AND owner_phone=$2', [req.params.id, owner]);
    if (clientRes.rowCount === 0) return res.status(404).json({ error: 'Client not found' });
    
    const debtsRes = await pool.query(
      'SELECT * FROM debts WHERE client_id=$1 AND creditor=$2 ORDER BY id DESC', 
      [req.params.id, owner]
    );
    
    const debtsWithBalance = [];
    for (const debt of debtsRes.rows) {
      const balance = await calculateDebtBalance(debt.id);
      debtsWithBalance.push({
        ...debt,
        total_paid: balance.total_payments,
        total_additions: balance.total_additions,
        total_debt: balance.total_debt,
        remaining: balance.remaining
      });
    }
    
    res.json(debtsWithBalance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;