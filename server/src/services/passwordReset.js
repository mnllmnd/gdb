import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db.js';

// Chargement des variables SMTP depuis le fichier .env
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

// Création du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true pour 465 (SSL), false pour 587 (TLS)
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

class PasswordResetService {
  // 🔹 Générer un token aléatoire
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 🔹 Hacher le token (pour ne pas le stocker en clair)
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // 🔹 Créer et enregistrer un token de réinitialisation
  static async createResetToken(userId) {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 3600000); // expire dans 1h

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [userId, tokenHash, expiresAt]
    );

    return token;
  }

  // 🔹 Vérifier la validité du token
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

  // 🔹 Marquer le token comme utilisé
  static async markTokenUsed(tokenId) {
    await pool.query(`UPDATE password_reset_tokens SET used = true WHERE id = $1`, [tokenId]);
  }

  // 🔹 Envoyer l'email de réinitialisation via SMTP
  static async sendResetEmail(email, token, origin) {
    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
      // Vérifier la connexion SMTP (utile pour déboguer)
      await transporter.verify();
    } catch (verifyError) {
      console.error('⚠️ Échec de vérification SMTP :', verifyError);
      console.log(`Lien de réinitialisation pour ${email}: ${resetUrl}`);
      return { sent: false, link: resetUrl, reason: 'smtp-verify-failed', error: String(verifyError) };
    }

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <h1>Réinitialisation du mot de passe</h1>
          <p>Bonjour,</p>
          <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>
        `,
      });

      console.log(`✅ Email de réinitialisation envoyé à ${email}`);
      return { sent: true, info };
    } catch (error) {
      console.error('❌ Échec de l’envoi SMTP :', error);
      console.log(`Lien de réinitialisation pour ${email}: ${resetUrl}`);
      return { sent: false, link: resetUrl, reason: 'send-failed', error: String(error) };
    }
  }
}

export default PasswordResetService;
