import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcrypt';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

// Rate limiter for forgot-password to prevent abuse
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 6,
    message: 'Trop de tentatives, réessayez plus tard.'
});

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

// POST /api/auth/forgot-password
// Body: { email }
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email requis' });

        // Find user by email
        const userRow = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
        if (userRow.rowCount === 0) {
            // Don't reveal whether email exists
            return res.status(200).json({ message: 'Si cette adresse est enregistrée, vous recevrez un code par email.' });
        }

        const userId = userRow.rows[0].id;
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store hashed OTP
        await pool.query(
            `INSERT INTO password_reset_otps (user_id, email, otp_hash, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [userId, email, otpHash, expiresAt]
        );

        // Send email via SendGrid
        const from = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'no-reply@example.com';
        const msg = {
            to: email,
            from,
            subject: 'Code de réinitialisation de mot de passe',
            text: `Votre code de réinitialisation est : ${otp}. Il expire dans 10 minutes.`,
            html: `<p>Votre code de réinitialisation est : <strong>${otp}</strong></p><p>Il expire dans 10 minutes.</p>`
        };

        try {
            await sgMail.send(msg);
            console.log(`forgot-password: OTP sent to ${email}`);
        } catch (sendErr) {
            console.error('forgot-password: failed to send OTP email', sendErr);
            // Do not reveal to client; continue with generic response
        }

        return res.status(200).json({ message: 'Si cette adresse est enregistrée, vous recevrez un code par email.' });
    } catch (err) {
        console.error('forgot-password error:', err);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }
});

// POST /api/auth/reset-password
// Body: { email, code, newPassword }
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) return res.status(400).json({ message: 'Email, code et nouveau mot de passe requis' });

        const codeHash = hashOtp(String(code));
        const q = await pool.query(
            `SELECT id, user_id, expires_at FROM password_reset_otps
             WHERE email = $1 AND otp_hash = $2
             LIMIT 1`,
            [email, codeHash]
        );

        if (q.rowCount === 0) {
            return res.status(400).json({ message: 'Code invalide ou déjà utilisé' });
        }

        const otpRow = q.rows[0];
        const now = new Date();
        if (new Date(otpRow.expires_at) < now) {
            await pool.query('DELETE FROM password_reset_otps WHERE id = $1', [otpRow.id]);
            return res.status(400).json({ message: 'Le code a expiré' });
        }

        // Hash new password and update user
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, otpRow.user_id]);

        // Delete OTP after use
        await pool.query('DELETE FROM password_reset_otps WHERE id = $1', [otpRow.id]);

        return res.status(200).json({ success: true, message: 'Mot de passe réinitialisé' });
    } catch (err) {
        console.error('reset-password error:', err);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }
});

export default router;