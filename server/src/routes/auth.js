const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb, serverTimestamp } = require('../config/db');
const { resolveUserRole } = require('../config/roles');

const router = express.Router();

const toUserResponse = (id, data) => ({
  id,
  email: data.email,
  name: data.name,
  locale: data.locale,
  householdId: data.householdId || null,
  role: resolveUserRole(data.email, data.role)
});

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, locale = 'he' } = req.body;
    const db = getDb();

    try {
      const existingUsers = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!existingUsers.empty) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userRef = db.collection('users').doc();
      const householdRef = db.collection('households').doc();
      const currency = locale === 'he' ? 'ILS' : 'USD';

      const householdData = {
        name: `${name}'s Household`,
        members: [userRef.id],
        currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const userRole = resolveUserRole(email, null);

      const userData = {
        email,
        passwordHash,
        name,
        locale,
        role: userRole,
        householdId: householdRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const batch = db.batch();
      batch.set(householdRef, householdData);
      batch.set(userRef, userData);
      await batch.commit();

      res.status(201).json({
        message: 'User created successfully',
        userId: userRef.id
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    try {
      const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
      if (userQuery.empty) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const userDoc = userQuery.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const role = resolveUserRole(user.email, user.role);

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, householdId: user.householdId || null, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      res.json({
        accessToken,
        refreshToken,
        user: toUserResponse(user.id, user)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Refresh Token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const db = getDb();

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userDoc = await db.collection('users').doc(decoded.id).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    const role = resolveUserRole(user.email, user.role);

    const accessToken = jwt.sign(
      { id: userDoc.id, email: user.email, householdId: user.householdId || null, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
