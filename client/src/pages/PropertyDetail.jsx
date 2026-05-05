import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', codes: [], notes: '' });
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await api.get(`/codes/${id}`);
      setProperty(data);
      setForm({ name: data.name, codes: data.codes.map(c => ({ ...c })), notes: data.notes || '' });
    } catch {
      setError('Property not found');
    }
  };

  const copyCode = (value, idx) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put(`/codes/${id}`, form);
      setProperty(data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/codes/${id}`);
      navigate('/codes');
    } catch {
      setError('Delete failed');
    }
  };

  const addCodeRow = () => setForm(f => ({ ...f, codes: [...f.codes, { label: '', value: '' }] }));
  const removeCodeRow = (i) => setForm(f => ({ ...f, codes: f.codes.filter((_, idx) => idx !== i) }));
  const updateCode = (i, field, val) =>
    setForm(f => ({ ...f, codes: f.codes.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }));

  if (error && !property) return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate('/codes')}>← Back to Properties</button>
      <div className="alert-error">{error}</div>
    </div>
  );

  if (!property) return (
    <div className="detail-page">
      <div className="loading-spinner"><div className="spinner" />Loading…</div>
    </div>
  );

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate('/codes')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Properties
      </button>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="detail-card">
        {editing ? (
          <div className="edit-form">
            <div className="field">
              <label className="field-label">Property Name</label>
              <input
                className="edit-name-input"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Property name"
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
                    <button className="remove-row-btn" onClick={() => removeCodeRow(i)} title="Remove">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <button className="add-row-btn" onClick={addCodeRow}>+ Add code</button>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Notes (optional)</label>
              <textarea
                className="textarea"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes…"
                rows={3}
              />
            </div>

            <div className="edit-form-actions">
              <button className="btn-ghost" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="detail-card-header">
              <h1 className="detail-prop-name">{property.name}</h1>
              <div className="detail-actions">
                {user?.role === 'admin' && (
                  <button className="btn-secondary" onClick={() => setEditing(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="detail-card-body">
              {property.codes.length === 0 ? (
                <div className="no-codes-block">No access codes stored for this property.</div>
              ) : (
                property.codes.map((c, i) => (
                  <div key={i} className="code-row">
                    <span className="code-row-label">{c.label}</span>
                    <span className="code-row-value">{c.value}</span>
                    <button
                      className={`copy-btn${copied === i ? ' copied' : ''}`}
                      onClick={() => copyCode(c.value, i)}
                    >
                      {copied === i ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ))
              )}

              {property.notes && (
                <div className="detail-notes">📝 {property.notes}</div>
              )}
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </div>
            <h3>Delete "{property.name}"?</h3>
            <p>This will permanently remove the property and all its access codes. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
