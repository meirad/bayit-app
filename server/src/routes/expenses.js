const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, serverTimestamp } = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const toExpenseResponse = (doc) => ({ id: doc.id, ...doc.data() });

const monthFromDate = (dateValue) => String(dateValue).substring(0, 7);

const adjustBudgetSpentAmount = async (db, householdId, month, category, delta) => {
  const budgetQuery = await db
    .collection('budgets')
    .where('householdId', '==', householdId)
    .where('month', '==', month)
    .limit(1)
    .get();

  if (budgetQuery.empty) {
    return;
  }

  const budgetDoc = budgetQuery.docs[0];
  const budgetData = budgetDoc.data();
  const categories = Array.isArray(budgetData.categories) ? [...budgetData.categories] : [];
  const categoryIndex = categories.findIndex((entry) => entry.categoryName === category);

  if (categoryIndex === -1) {
    return;
  }

  const existing = Number(categories[categoryIndex].spentAmount || 0);
  categories[categoryIndex] = {
    ...categories[categoryIndex],
    spentAmount: existing + Number(delta)
  };

  await budgetDoc.ref.update({
    categories,
    updatedAt: serverTimestamp()
  });
};

// Add expense
router.post(
  '/',
  authMiddleware,
  [
    body('amount').isFloat({ min: 0.01 }),
    body('category').trim().notEmpty(),
    body('date').isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, description, date } = req.body;
    const { householdId } = req.user;
    const db = getDb();

    if (!householdId) {
      return res.status(400).json({ error: 'User must belong to a household' });
    }

    try {
      const payload = {
        householdId,
        userId: req.user.id,
        amount: Number(amount),
        category,
        description: description || '',
        date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const expenseRef = await db.collection('expenses').add(payload);
      const savedExpense = await expenseRef.get();

      // Update budget spent amount
      const month = monthFromDate(date);
      await adjustBudgetSpentAmount(db, householdId, month, category, Number(amount));

      res.status(201).json(toExpenseResponse(savedExpense));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get expenses for household
router.get('/household/:householdId', authMiddleware, async (req, res) => {
  const { householdId } = req.params;
  const { month, category, userId } = req.query;
  const db = getDb();

  if (String(req.user.householdId) !== householdId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const expenseSnapshot = await db.collection('expenses').where('householdId', '==', householdId).get();
    let expenses = expenseSnapshot.docs.map(toExpenseResponse);

    if (month) {
      expenses = expenses.filter((expense) => monthFromDate(expense.date) === month);
    }

    if (category) {
      expenses = expenses.filter((expense) => expense.category === category);
    }

    if (userId) {
      expenses = expenses.filter((expense) => expense.userId === userId);
    }

    const userIds = [...new Set(expenses.map((expense) => expense.userId).filter(Boolean))];
    const users = await Promise.all(userIds.map((id) => db.collection('users').doc(id).get()));
    const usersById = new Map(
      users
        .filter((doc) => doc.exists)
        .map((doc) => [doc.id, { id: doc.id, name: doc.data().name, email: doc.data().email }])
    );

    expenses = expenses
      .map((expense) => ({
        ...expense,
        userId: usersById.get(expense.userId) || expense.userId
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;
  const db = getDb();

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can edit expenses' });
    }

    const expenseRef = db.collection('expenses').doc(id);
    const expenseDoc = await expenseRef.get();

    if (!expenseDoc.exists) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expense = { id: expenseDoc.id, ...expenseDoc.data() };

    if (String(expense.householdId) !== String(req.user.householdId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldAmount = Number(expense.amount || 0);
    const oldCategory = expense.category;
    const oldMonth = monthFromDate(expense.date);

    const updatedExpense = {
      ...expense,
      amount: amount !== undefined ? Number(amount) : Number(expense.amount),
      category: category !== undefined ? category : expense.category,
      description: description !== undefined ? description : expense.description,
      date: date !== undefined ? date : expense.date,
      updatedAt: serverTimestamp()
    };

    await expenseRef.update({
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
      updatedAt: updatedExpense.updatedAt
    });

    // Update budget
    const newMonth = monthFromDate(updatedExpense.date);
    if (oldCategory === updatedExpense.category && oldMonth === newMonth) {
      const diff = Number(updatedExpense.amount) - oldAmount;
      await adjustBudgetSpentAmount(db, updatedExpense.householdId, newMonth, updatedExpense.category, diff);
    } else {
      await adjustBudgetSpentAmount(db, updatedExpense.householdId, oldMonth, oldCategory, -oldAmount);
      await adjustBudgetSpentAmount(
        db,
        updatedExpense.householdId,
        newMonth,
        updatedExpense.category,
        Number(updatedExpense.amount)
      );
    }

    const saved = await expenseRef.get();
    res.json(toExpenseResponse(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete expenses' });
    }

    const expenseRef = db.collection('expenses').doc(id);
    const expenseDoc = await expenseRef.get();

    if (!expenseDoc.exists) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expense = { id: expenseDoc.id, ...expenseDoc.data() };

    if (String(expense.householdId) !== String(req.user.householdId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const month = monthFromDate(expense.date);
    await adjustBudgetSpentAmount(db, expense.householdId, month, expense.category, -Number(expense.amount));

    await expenseRef.delete();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
