import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          {submitted ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <h2>Check your email</h2>
              <p style={{ marginBottom: 24 }}>
                If <strong>{email}</strong> is registered, we've sent a reset link. Check your inbox (and spam folder).
              </p>
              <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Back to login
              </Link>
            </>
          ) : (
            <>
              <h2>Forgot your password?</h2>
              <p>Enter your email and we'll send you a reset link.</p>

              {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="auth-footer">
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
