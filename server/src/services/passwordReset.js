import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import sgMail from '@sendgrid/mail';

// create transporter with sensible defaults; parse port as number
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = smtpHost
    ? nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
        })
    : null;

// Configure SendGrid if provided (preferred when set)
const sendgridApiKey = process.env.SENDGRID_API_KEY || null;
if (sendgridApiKey) {
    try {
        sgMail.setApiKey(sendgridApiKey);
        console.log('ℹ️  SendGrid configured for sending emails')
    } catch (e) {
        console.warn('Failed to configure SendGrid:', e?.message || e)
    }
}

function isSmtpConfigured() {
    return !!(smtpHost && smtpPort && smtpUser && smtpPass && transporter);
}

function isSendGridConfigured() {
    return !!sendgridApiKey;
}

class PasswordResetService {
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    static async createResetToken(userId) {
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        const query = `
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            RETURNING id`;
        
        await pool.query(query, [userId, tokenHash, expiresAt]);
        return token;
    }

    static async verifyToken(token) {
        const tokenHash = this.hashToken(token);
        const query = `
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON u.id = prt.user_id
            WHERE token_hash = $1 
            AND used = false 
            AND expires_at > NOW()`;
        
        const result = await pool.query(query, [tokenHash]);
        return result.rows[0];
    }

    static async markTokenUsed(tokenId) {
        const query = 'UPDATE password_reset_tokens SET used = true WHERE id = $1';
        await pool.query(query, [tokenId]);
    }

    static async sendResetEmail(email, token, origin) {
        const resetUrl = `${origin}/reset-password?token=${token}`;

        // Prefer SendGrid API when configured (easy free tier sign-up)
        if (isSendGridConfigured()) {
            try {
                const msg = {
                    to: email,
                    from: process.env.SENDGRID_FROM || process.env.SMTP_FROM || smtpUser,
                    subject: 'Réinitialisation de votre mot de passe',
                    html: `
                        <h1>Réinitialisation de mot de passe</h1>
                        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
                        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                        <a href="${resetUrl}">${resetUrl}</a>
                        <p>Ce lien expirera dans 1 heure.</p>
                        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    `
                };
                const info = await sgMail.send(msg);
                return { sent: true, provider: 'sendgrid', info };
            } catch (err_) {
                console.error('SendGrid send failed, falling back to SMTP/log:', err_);
                // fallthrough to SMTP or console fallback
            }
        }

        // If SMTP is not configured or we're in development, log the link to the server console and return the link
        if (!isSmtpConfigured() || process.env.NODE_ENV === 'development') {
            console.log(`Password reset link for ${email}: ${resetUrl}`);
            return { sent: false, link: resetUrl, reason: 'smtp-not-configured-or-dev' };
        }

        // Verify transporter connectivity before sending to get a clearer error message
        try {
            await transporter.verify();
        } catch (error_) {
            console.error('SMTP verify failed:', error_);
            console.log(`Password reset link for ${email}: ${resetUrl}`);
            return { sent: false, link: resetUrl, reason: 'smtp-verify-failed', error: String(error_) };
        }

        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
                    <h1>Réinitialisation de mot de passe</h1>
                    <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>Ce lien expirera dans 1 heure.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                `
            });
            return { sent: true, info };
        } catch (error_) {
            console.error('Failed to send reset email, falling back to console log:', error_);
            console.log(`Password reset link for ${email}: ${resetUrl}`);
            return { sent: false, link: resetUrl, reason: 'send-failed', error: String(error_) };
        }
    }
}

export default PasswordResetService;