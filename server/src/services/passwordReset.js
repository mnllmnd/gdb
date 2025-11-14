import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db.js';

// Chargement des variables SMTP depuis le fichier .env
// SendGrid utilise :
// HOST = smtp.sendgrid.net
// USER = "apikey"
// PASS = ta cle API
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER || "apikey"; 
const smtpPass = process.env.SMTP_PASS; // DOIT être collée telle quelle
const smtpFrom = process.env.SMTP_FROM || smtpUser;

// Transporteur Nodemailer compatible SendGrid
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false, // SendGrid = false sur port 587 (TLS)
  auth: {
    user: smtpUser, // DOIT être "apikey"
    pass: smtpPass, // TA CLE API
  },
});

class PasswordResetService {
  // Générer un token
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hasher le token
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Créer et stocker un token
  static async createResetToken(userId) {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 3600000);

    try {
      const result = await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
         VALUES ($1, $2, $3, false)
         RETURNING id`,
        [userId, tokenHash, expiresAt]
      );

      console.log(`🔐 Token created id=${result.rows[0].id} for user=${userId}`);
      return token;
    } catch (err) {
      console.error("❌ DB ERROR creating reset token:", err.message);
      throw err;
    }
  }

  // Vérifier token
  static async verifyToken(token) {
    const tokenHash = this.hashToken(token);
    const result = await pool.query(
      `SELECT prt.*, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE token_hash = $1
       AND used = false
       AND expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0];
  }

  // Marquer token utilisé
  static async markTokenUsed(tokenId) {
    await pool.query(
      `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
      [tokenId]
    );
  }

  // Envoi email avec SendGrid
  static async sendResetEmail(email, token, origin) {

    const frontendBase = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      process.env.FRONTEND ||
      ''
    ).toString().trim() || origin;

    const base = frontendBase.replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?token=${token}`;

    console.log(`🔗 Reset URL: ${resetUrl}`);

    // Vérification SMTP
    try {
      await transporter.verify();
      console.log("📨 SendGrid SMTP verified.");
    } catch (error) {
      console.error("⚠️ SendGrid verify error:", error);
      return { sent: false, link: resetUrl, reason: "smtp-verify-failed" };
    }

    // Envoi réel
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <h1>Réinitialisation du mot de passe</h1>
          <p>Bonjour,</p>
          <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Ce lien expirera dans 1 heure.</p>
        `,
      });

      console.log(`✅ Email envoyé via SendGrid -> ${email} (messageId: ${info.messageId})`);
      return { sent: true, info };

    } catch (err) {
      console.error("❌ SendGrid sendMail failed:", err);
      return { sent: false, link: resetUrl, reason: "send-failed" };
    }
  }
}

export default PasswordResetService;
