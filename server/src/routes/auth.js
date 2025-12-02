import express from 'express';
import { query } from '../db.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

const SALT_ROUNDS = 10;

// ============================================
// REGISTER - Create new user
// ============================================
router.post('/register', async (req, res) => {
  const { email, phone, password, display_name } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'email or phone required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'password required' });
  }

  try {
    // Check if email or phone already exists
    if (email) {
      const emailExists = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailExists.rowCount > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    if (phone) {
      const phoneExists = await query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (phoneExists.rowCount > 0) {
        return res.status(409).json({ error: 'Phone already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (email, phone, password_hash, display_name, role) 
       VALUES ($1, $2, $3, $4, 'client') 
       RETURNING id, email, phone, display_name, role, created_at`,
      [email || null, phone || null, hashedPassword, display_name || null]
    );

    const user = result.rows[0];

    // Generate JWT token after user is created
    const token = generateToken({ id: user.id, phone: user.phone, email: user.email, role: user.role });

    console.log('✓ User registered:', user.id);

    res.status(201).json({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================
// LOGIN - Authenticate user with email/phone + password
// ============================================
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'email or phone required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'password required' });
  }

  try {
    // Find user by email or phone
    let result;
    if (email) {
      result = await query(
        'SELECT id, email, phone, password_hash, display_name, role FROM users WHERE email = $1',
        [email]
      );
    } else {
      result = await query(
        'SELECT id, email, phone, password_hash, display_name, role FROM users WHERE phone = $1',
        [phone]
      );
    }

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, phone: user.phone, email: user.email, role: user.role });

    console.log('✓ User logged in:', user.id);

    res.json({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================
// GET PROFILE - Get current user info
// ============================================
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(
      'SELECT id, email, phone, display_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================
// UPDATE PROFILE - Update user information
// ============================================
router.patch('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { email, phone, display_name, password } = req.body;

  try {
    // Check if email/phone already exists for other users
    if (email) {
      const emailExists = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailExists.rowCount > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    if (phone) {
      const phoneExists = await query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, userId]
      );
      if (phoneExists.rowCount > 0) {
        return res.status(409).json({ error: 'Phone already in use' });
      }
    }

    // If password update is requested
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await query(
        'UPDATE users SET email = COALESCE($1, email), phone = COALESCE($2, phone), display_name = COALESCE($3, display_name), password_hash = $4 WHERE id = $5 RETURNING id, email, phone, display_name, role',
        [email || null, phone || null, display_name || null, hashedPassword, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('✓ User profile updated:', userId);
      return res.json(result.rows[0]);
    }

    // Update without password change
    const result = await query(
      'UPDATE users SET email = COALESCE($1, email), phone = COALESCE($2, phone), display_name = COALESCE($3, display_name) WHERE id = $4 RETURNING id, email, phone, display_name, role',
      [email || null, phone || null, display_name || null, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✓ User profile updated:', userId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or phone already in use' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================
// FORGOT PASSWORD - Request password reset
// ============================================
router.post('/forgot-password', async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'email or phone required' });
  }

  try {
    // Find user
    let result;
    if (email) {
      result = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    } else {
      result = await query('SELECT id, email FROM users WHERE phone = $1', [phone]);
    }

    if (result.rowCount === 0) {
      // Don't reveal if email exists (security)
      return res.json({ message: 'If user exists, a reset link will be sent' });
    }

    const user = result.rows[0];

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    console.log('✓ Password reset token created for user:', user.id);

    res.json({
      message: 'Password reset link sent',
      reset_token: token,
      expires_in_hours: 1
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================
// RESET PASSWORD - Reset password with token
// ============================================
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: 'token and new_password required' });
  }

  try {
    // Find valid reset token
    const result = await query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const resetToken = result.rows[0];

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );

    // Delete used token
    await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    console.log('✓ Password reset for user:', resetToken.user_id);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
