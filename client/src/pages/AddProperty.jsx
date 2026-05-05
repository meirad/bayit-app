import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function AddProperty() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', codes: [{ label: '', value: '' }], notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addRow = () => setForm(f => ({ ...f, codes: [...f.codes, { label: '', value: '' }] }));
  const removeRow = (i) => setForm(f => ({ ...f, codes: f.codes.filter((_, idx) => idx !== i) }));
  const updateCode = (i, field, val) =>
    setForm(f => ({ ...f, codes: f.codes.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const codes = form.codes.filter(c => c.label.trim() && c.value.trim());
    setSaving(true);
    try {
      const { data } = await api.post('/codes', { ...form, codes });
      navigate(`/codes/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate('/codes')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Properties
      </button>

      <div className="detail-card">
        <div className="detail-card-header">
          <h1 className="detail-prop-name">New Property</h1>
        </div>

        {error && <div className="alert-error" style={{ margin: '0 28px 16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="field">
            <label className="field-label">Property Name</label>
            <input
              className="edit-name-input"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Radak 48"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label">Access Codes</label>
            <div className="edit-codes-list">
              {form.codes.map((c, i) => (
                <div key={i} className="edit-code-row">
                  <input
                    className="edit-label-input"
                    value={c.label}
                    onChange={(e) => updateCode(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Main door)"
                  />
                  <input
                    className="edit-value-input"
                    value={c.value}
                    onChange={(e) => updateCode(i, 'value', e.target.value)}
                    placeholder="Code"
                  />
                  {form.codes.length > 1 && (
                    <button type="button" className="remove-row-btn" onClick={() => removeRow(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-row-btn" onClick={addRow}>+ Add another code</button>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Notes (optional)</label>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes about the property…"
              rows={3}
            />
          </div>

          <div className="edit-form-actions">
            <button type="button" className="btn-ghost" onClick={() => navigate('/codes')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
