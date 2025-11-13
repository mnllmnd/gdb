import express from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import PasswordResetService from '../services/passwordReset.js';

const router = express.Router();

// Rate limiter pour /forgot-password - 5 tentatives par heure par IP
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5,
    message: 'Trop de tentatives de réinitialisation. Veuillez réessayer dans une heure.'
});

// Route pour demander une réinitialisation
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        
        // Vérifier si l'utilisateur existe
        const userQuery = 'SELECT id FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [email]);
        
        if (userResult.rows.length === 0) {
            // Ne pas révéler si l'email existe ou non
            return res.status(200).json({
                message: 'Si cette adresse email est associée à un compte, vous recevrez un email de réinitialisation.'
            });
        }

        const userId = userResult.rows[0].id;
        
        // Générer et enregistrer le token
        const token = await PasswordResetService.createResetToken(userId);

        // Envoyer l'email (service returns diagnostic info)
        const sendResult = await PasswordResetService.sendResetEmail(
            email,
            token,
            `${req.protocol}://${req.get('host')}`
        );

        // Debug log: record provider response so we can trace delivery issues (server-side only)
        try {
            console.log(`forgot-password: sendResult for ${email}:`, sendResult)
        } catch (e) {
            // ignore logging errors
        }

        // In development or if sending failed, include the link in the response for testing
        if (sendResult && (sendResult.sent === false || process.env.NODE_ENV === 'development')) {
            return res.status(200).json({
                message: 'Si cette adresse email est associée à un compte, vous recevrez un email de réinitialisation.',
                debug_link: sendResult.link,
                reason: sendResult.reason,
                error: sendResult.error,
            });
        }

        res.status(200).json({
            message: 'Si cette adresse email est associée à un compte, vous recevrez un email de réinitialisation.'
        });
    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Vérifier le token
        const resetToken = await PasswordResetService.verifyToken(token);
        if (!resetToken) {
            return res.status(400).json({
                message: 'Le lien de réinitialisation est invalide ou a expiré'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, resetToken.user_id]
        );

        // Marquer le token comme utilisé
        await PasswordResetService.markTokenUsed(resetToken.id);

        // Révoquer toutes les sessions existantes (optionnel)
        // TODO: Implémenter la révocation des sessions si nécessaire

        res.status(200).json({
            message: 'Votre mot de passe a été réinitialisé avec succès'
        });
    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
});

export default router;