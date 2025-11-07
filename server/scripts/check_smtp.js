import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load .env from the current working directory (server/). Simpler and more robust on Windows.
dotenv.config();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost) {
  console.error('SMTP_HOST is not set in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort || 587,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

console.log('Attempting transporter.verify() with the following config:');
console.log({ smtpHost, smtpPort, smtpUser: smtpUser ? 'SET' : 'MISSING', smtpPass: smtpPass ? 'SET' : 'MISSING' });

transporter.verify()
  .then(() => {
    console.log('SMTP verify: OK — transporter can connect and authenticate.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('SMTP verify: FAILED');
    console.error(err);
    process.exit(2);
  });
