# BayitBudget — React + Node (JS) Spec

**Goal**: Build an Israeli, family-focused budgeting app where members of a household group track shared expenses, see a real-time dashboard, and plan monthly budgets together.

---

## 1. Tech Stack

### Frontend
- **React** (18+) with hooks & Context API (or optional Redux/Zustand)
- **React Router** v6 (for SPA navigation)
- **i18next** + **react-i18next** (Hebrew/English i18n + RTL support)
- **Axios** for API calls
- **CSS/SCSS** or **Tailwind CSS** (optional)
- **Recharts** or **Chart.js** for graphs

### Backend
- **Node.js** (18+) + **Express**
- **MongoDB** + **Mongoose** (or **PostgreSQL** + **Sequelize**)
- **JWT** (access + refresh tokens)
- **bcrypt** for password hashing
- **express-validator** for validation
- **helmet**, **cors**, rate-limiting for security

### DevOps / Hosting (Optional)
- **Docker** (for containerization)
- **Vercel** / **Netlify** (frontend), **Heroku** / **Railway** / **Render** (backend)
- **MongoDB Atlas** or local MongoDB instance

---

## 2. Data Models (MongoDB/Mongoose)

### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  name: String,
  locale: String ('he' | 'en'),
  householdId: ObjectId (ref: Household),
  createdAt: Date,
  updatedAt: Date
}
```

### Household
```javascript
{
  _id: ObjectId,
  name: String,
  members: [ObjectId] (ref: User),
  currency: String ('ILS'),
  createdAt: Date,
  updatedAt: Date
}
```

### Budget
```javascript
{
  _id: ObjectId,
  householdId: ObjectId (ref: Household),
  month: String ('2025-01'),
  categories: [
    {
      categoryName: String,
      budgetedAmount: Number,
      spentAmount: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Expense
```javascript
{
  _id: ObjectId,
  householdId: ObjectId (ref: Household),
  userId: ObjectId (ref: User),
  amount: Number,
  category: String,
  description: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. API Routes (Express)

### Auth Routes (`/api/auth`)
- **POST** `/register` – Create user account
- **POST** `/login` – Issue JWT tokens
- **POST** `/refresh` – Refresh access token
- **POST** `/logout` – Invalidate refresh token

### User Routes (`/api/users`)
- **GET** `/me` – Get current user profile
- **PUT** `/me` – Update user profile (name, locale)

### Household Routes (`/api/households`)
- **POST** `/` – Create a new household
- **GET** `/:id` – Get household details
- **PUT** `/:id` – Update household (name, currency)
- **POST** `/:id/invite` – Invite user by email
- **POST** `/:id/join` – Join household via invite code

### Budget Routes (`/api/budgets`)
- **POST** `/` – Create monthly budget
- **GET** `/household/:householdId/:month` – Get budget for specific month
- **PUT** `/:id` – Update budget categories/amounts

### Expense Routes (`/api/expenses`)
- **POST** `/` – Add expense
- **GET** `/household/:householdId` – List expenses (with filters: month, category, user)
- **PUT** `/:id` – Update expense
- **DELETE** `/:id` – Delete expense

---

## 4. Component Map (React)

```
App.jsx
├─ Router
   ├─ PublicLayout
   │  ├─ LoginPage
   │  └─ RegisterPage
   └─ PrivateLayout (requires auth)
      ├─ DashboardPage
      │  ├─ BudgetSummary
      │  ├─ ExpenseChart
      │  └─ RecentExpenses
      ├─ ExpensesPage
      │  ├─ ExpenseList
      │  ├─ ExpenseForm (add/edit)
      │  └─ ExpenseFilters
      ├─ BudgetPage
      │  ├─ MonthSelector
      │  └─ BudgetCategoryList
      ├─ HouseholdPage
      │  ├─ MemberList
      │  └─ InviteForm
      └─ ProfilePage
         └─ UserSettings (name, locale)
```

---

## 5. State Shape (Context/Redux)

### AuthContext
```javascript
{
  user: { id, email, name, locale, householdId },
  isAuthenticated: boolean,
  login: (email, password) => Promise,
  logout: () => void
}
```

### HouseholdContext
```javascript
{
  household: { id, name, members, currency },
  fetchHousehold: (id) => Promise,
  updateHousehold: (data) => Promise
}
```

### BudgetContext
```javascript
{
  currentBudget: { month, categories },
  fetchBudget: (householdId, month) => Promise,
  updateBudget: (budgetId, data) => Promise
}
```

### ExpenseContext
```javascript
{
  expenses: [{ id, amount, category, date, description, user }],
  addExpense: (data) => Promise,
  updateExpense: (id, data) => Promise,
  deleteExpense: (id) => Promise,
  fetchExpenses: (filters) => Promise
}
```

---

## 6. i18n + RTL (Hebrew/English)

### Setup
```javascript
// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    he: {
      translation: {
        "dashboard": "לוח בקרה",
        "expenses": "הוצאות",
        "budget": "תקציב",
        "household": "משק בית",
        // ...
      }
    },
    en: {
      translation: {
        "dashboard": "Dashboard",
        "expenses": "Expenses",
        "budget": "Budget",
        "household": "Household",
        // ...
      }
    }
  },
  lng: 'he',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
```

### RTL Toggle
```javascript
// App.jsx
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  
  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);
  
  return <Router>...</Router>;
}
```

---

## 7. Security & Best Practices

- **JWT**: HttpOnly cookies or localStorage (with XSS protection)
- **CSRF**: Use tokens for state-changing requests
- **Rate Limiting**: `express-rate-limit` on auth endpoints
- **Input Validation**: `express-validator` on all inputs
- **HTTPS**: Force in production
- **Environment Variables**: `.env` for secrets (never commit)

---

## 8. Example Code

### Backend: Add Expense Route
```javascript
// server/routes/expenses.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  [
    body('amount').isFloat({ min: 0.01 }),
    body('category').notEmpty(),
    body('date').isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, description, date } = req.body;
    const { householdId } = req.user;

    try {
      const expense = new Expense({
        householdId,
        userId: req.user.id,
        amount,
        category,
        description,
        date
      });
      await expense.save();

      // Update budget spent amount
      const month = date.substring(0, 7); // '2025-01'
      await Budget.updateOne(
        { householdId, month, 'categories.categoryName': category },
        { $inc: { 'categories.$.spentAmount': amount } }
      );

      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
```

### Frontend: ExpenseForm Component
```javascript
// client/src/components/ExpenseForm.jsx
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpenseContext } from '../context/ExpenseContext';

function ExpenseForm() {
  const { t } = useTranslation();
  const { addExpense } = useContext(ExpenseContext);
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addExpense(form);
    setForm({ amount: '', category: '', description: '', date: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        placeholder={t('amount')}
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder={t('category')}
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder={t('description')}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />
      <button type="submit">{t('add_expense')}</button>
    </form>
  );
}

export default ExpenseForm;
```

---

## 9. Getting Started

### Prerequisites
```bash
node -v  # 18+
npm -v   # 9+
```

### Installation
```bash
# Clone repo
git clone https://github.com/yourorg/bayit-budget.git
cd bayit-budget

# Install dependencies
npm install
cd client && npm install && cd ..

# Setup environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT_SECRET, etc.
```

### Run Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client

# Or run both concurrently
npm run dev
```

### Environment Variables (.env)
```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bayit-budget
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Client (optional)
VITE_API_URL=http://localhost:5000
```

---

## 10. Roadmap

### Phase 1: MVP
- [ ] User auth (register, login, JWT)
- [ ] Create/join household
- [ ] Add/list/delete expenses
- [ ] Basic budget creation
- [ ] Dashboard with expense summary

### Phase 2: Core Features
- [ ] Budget vs. actual comparison
- [ ] Expense categories & filters
- [ ] Monthly budget rollover
- [ ] Responsive UI + RTL support

### Phase 3: Advanced
- [ ] Recurring expenses
- [ ] Receipt upload (image OCR)
- [ ] Export to CSV/PDF
- [ ] Push notifications (budget alerts)
- [ ] Mobile app (React Native)

---

## 11. Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 12. License

MIT License - see [LICENSE](LICENSE) file

---

**Questions?** Open an issue or contact the maintainer.

**Happy budgeting! 💰🏠**
