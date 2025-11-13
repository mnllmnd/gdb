import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️ Erreur de connexion SMTP :', error);
  } else {
    console.log('✅ Connexion SMTP réussie ! Prêt à envoyer.');
  }
});

const sendTestMail = async () => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'papendiaye511@gmail.com', // <-- Mets ici ton adresse pour tester
      subject: 'Test SMTP Gmail',
      html: '<h1>✅ Test réussi !</h1><p>Ton SMTP Gmail fonctionne.</p>',
    });
    console.log('📨 Email envoyé :', info.messageId);
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du mail :', error);
  }
};

sendTestMail();
