const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, serverTimestamp } = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const normalizeCodes = (codes = []) => (
  Array.isArray(codes)
    ? codes
      .map((entry) => ({
        label: (entry?.label || '').trim(),
        value: (entry?.value || '').trim()
      }))
      .filter((entry) => entry.label && entry.value)
    : []
);

const toPropertyResponse = (doc) => ({
  id: doc.id,
  ...doc.data()
});

// All routes require auth
router.use(authMiddleware);

// GET /api/codes?q=search
router.get('/', async (req, res) => {
  const { q } = req.query;
  const db = getDb();
  try {
    const householdId = req.user.householdId || null;
    let snapshot;

    if (req.user.isAdmin) {
      snapshot = await db.collection('properties').get();
    } else {
      if (!householdId) {
        return res.status(400).json({ error: 'User must belong to a household' });
      }
      snapshot = await db.collection('properties').where('householdId', '==', householdId).get();
    }

    let properties = snapshot.docs.map(toPropertyResponse);
    if (q && q.trim()) {
      const normalized = q.trim().toLowerCase();
      properties = properties.filter((property) => property.name.toLowerCase().includes(normalized));
    }

    properties.sort((a, b) => a.name.localeCompare(b.name));
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/codes/:id
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    const doc = await db.collection('properties').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Property not found' });

    const property = toPropertyResponse(doc);
    if (!req.user.isAdmin && property.householdId !== req.user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/codes
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('codes').isArray().withMessage('Codes must be an array'),
    body('codes.*.label').trim().notEmpty().withMessage('Code label required'),
    body('codes.*.value').trim().notEmpty().withMessage('Code value required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDb();

    try {
      const householdId = req.user.householdId || null;
      if (!householdId) {
        return res.status(400).json({ error: 'User must belong to a household' });
      }

      const payload = {
        name: req.body.name.trim(),
        codes: normalizeCodes(req.body.codes),
        notes: (req.body.notes || '').trim(),
        householdId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const ref = await db.collection('properties').add(payload);
      const savedDoc = await ref.get();
      res.status(201).json(toPropertyResponse(savedDoc));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/codes/:id
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('codes').isArray().withMessage('Codes must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDb();

    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Only admins can edit properties' });
      }

      const ref = db.collection('properties').doc(req.params.id);
      const current = await ref.get();
      if (!current.exists) return res.status(404).json({ error: 'Property not found' });

      const existing = current.data();
      if (!req.user.isAdmin && existing.householdId !== req.user.householdId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await ref.update({
        name: req.body.name.trim(),
        codes: normalizeCodes(req.body.codes),
        notes: (req.body.notes || '').trim(),
        updatedAt: serverTimestamp()
      });

      const updated = await ref.get();
      res.json(toPropertyResponse(updated));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/codes/:id
router.delete('/:id', async (req, res) => {
  const db = getDb();
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete properties' });
    }

    const ref = db.collection('properties').doc(req.params.id);
    const current = await ref.get();
    if (!current.exists) return res.status(404).json({ error: 'Property not found' });

    const property = current.data();
    if (!req.user.isAdmin && property.householdId !== req.user.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await ref.delete();
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
