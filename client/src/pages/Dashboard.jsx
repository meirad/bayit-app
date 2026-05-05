import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Health', 'Entertainment', 'Shopping', 'Other'];

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().substring(0, 10)
  });

  const currentMonth = new Date().toISOString().substring(0, 7);

  const fetchExpenses = async () => {
    if (!user?.householdId) return;
    try {
      const { data } = await api.get(`/expenses/household/${user.householdId}`, {
        params: { month: currentMonth }
      });
      setExpenses(data);
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/expenses', {
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        date: form.date
      });
      setForm({ amount: '', category: 'Food', description: '', date: new Date().toISOString().substring(0, 10) });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch {
      setError('Failed to delete expense');
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const monthLabel = new Date(currentMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="dashboard">
      <main className="dash-main">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--slate-900)' }}>
            {monthLabel}
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Hello, {user?.name}</span>
        </div>
        <div className="summary-card">
          <h2>Total Spent</h2>
          <div className="total">Total spent: <strong>₪{total.toFixed(2)}</strong></div>
          {Object.keys(byCategory).length > 0 && (
            <div className="category-breakdown">
              {Object.entries(byCategory).map(([cat, amt]) => (
                <div key={cat} className="cat-row">
                  <span>{cat}</span>
                  <span>₪{amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="expenses-section">
          <div className="section-header">
            <h3>Expenses</h3>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Expense'}
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {showForm && (
            <form className="expense-form" onSubmit={handleAdd}>
              <div className="form-row">
                <div>
                  <label>Amount (₪)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <button type="submit" className="btn-primary">Save Expense</button>
            </form>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="empty">No expenses this month. Add one!</p>
          ) : (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td><span className="badge">{exp.category}</span></td>
                    <td>{exp.description || '—'}</td>
                    <td>₪{exp.amount.toFixed(2)}</td>
                    <td>
                      {user?.role === 'admin' && (
                        <button className="btn-danger" onClick={() => handleDelete(exp.id)}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
