import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-panel-brand">
        <div className="auth-panel-brand-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h1>Bayit</h1>
        <p>Manage all your property access codes in one secure place.</p>
      </div>

      <div className="auth-panel-form">
        <div className="auth-form-inner">
          {success ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2>Password updated!</h2>
              <p>Your password has been changed. Redirecting you to login…</p>
              <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 24 }}>
                Go to login
              </Link>
            </>
          ) : (
            <>
              <h2>Set a new password</h2>
              <p>Choose a strong password for your account.</p>

              {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label className="field-label">New password</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    disabled={!token}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Confirm password</label>
                  <input
                    className="input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                    disabled={!token}
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading || !token}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <p className="auth-footer">
                <Link to="/login">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
