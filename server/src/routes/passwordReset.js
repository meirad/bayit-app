const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/db');

const router = express.Router();

// ── Email transporter ──────────────────────────────────────────────────────
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  // Skip if not configured or still using placeholder values
  if (!SMTP_USER || !SMTP_PASS
    || SMTP_USER === 'your_gmail@gmail.com'
    || SMTP_PASS === 'your_gmail_app_password') return null;

  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
};

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Always return success to avoid email enumeration
    const successMsg = { message: 'If that email is registered, a reset link has been sent.' };

    try {
      const db = getDb();
      const snap = await db.collection('users').where('email', '==', req.body.email).limit(1).get();
      if (snap.empty) return res.json(successMsg);

      const userDoc = snap.docs[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour

      // Store token in Firestore
      await db.collection('passwordResets').doc(token).set({
        userId: userDoc.id,
        email: userDoc.data().email,
        expires,
        used: false
      });

      const transporter = createTransporter();
      if (!transporter) {
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        console.log('\n========================================');
        console.log('⚠️  SMTP not configured — password reset URL:');
        console.log(resetUrl);
        console.log('========================================\n');
        return res.json(successMsg);
      }

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: `"Property Codes App" <${process.env.SMTP_USER}>`,
        to: userDoc.data().email,
        subject: 'Reset your password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Reset your password</h2>
            <p>Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2e5ea9;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
            <p style="margin-top:24px;color:#666;font-size:13px">
              If you didn't request this, you can ignore this email.
            </p>
          </div>
        `
      });

      res.json(successMsg);
    } catch (err) {
      console.error('[PasswordReset] forgot-password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const db = getDb();
      const { token, password } = req.body;

      const tokenDoc = await db.collection('passwordResets').doc(token).get();
      if (!tokenDoc.exists) return res.status(400).json({ error: 'Invalid or expired reset link.' });

      const { userId, expires, used } = tokenDoc.data();
      if (used) return res.status(400).json({ error: 'This reset link has already been used.' });
      if (Date.now() > expires) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

      const passwordHash = await bcrypt.hash(password, 12);
      await db.collection('users').doc(userId).update({ passwordHash });
      await tokenDoc.ref.update({ used: true });

      res.json({ message: 'Password updated successfully. You can now log in.' });
    } catch (err) {
      console.error('[PasswordReset] reset-password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
