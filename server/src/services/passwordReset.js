import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import pool from '../db.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    const expiresAt = new Date(Date.now() + 3600000);

    const result = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
       VALUES ($1, $2, $3, false)
       RETURNING id`,
      [userId, tokenHash, expiresAt]
    );

    console.log(`🔐 Token created id=${result.rows[0].id} for user=${userId}`);
    return token;
  }

  static async sendResetEmail(email, token, origin) {
    const frontendBase = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      ''
    ).replace(/\/$/, '') || origin;

    const resetUrl = `${frontendBase}/reset-password?token=${token}`;

    try {
      await sgMail.send({
        to: email,
        from: process.env.SMTP_FROM,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <h1>Réinitialisation du mot de passe</h1>
          <p>Bonjour,</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Ce lien expirera dans 1 heure.</p>
        `,
      });

      console.log(`✅ Email envoyé à ${email} via SendGrid API`);
      return { sent: true, link: resetUrl };
    } catch (err) {
      console.error('❌ Échec SendGrid API:', err);
      return { sent: false, link: resetUrl, reason: 'sendgrid-failed' };
    }
  }
}

export default PasswordResetService;
