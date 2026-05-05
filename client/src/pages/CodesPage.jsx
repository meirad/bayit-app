import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function CodesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    fetchProperties('');
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProperties(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const fetchProperties = async (q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/codes', { params: q ? { q } : {} });
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p
    );
  };

  return (
    <div className="codes-page">
      {/* Top bar */}
      <div className="codes-topbar">
        <div>
          <h1 className="codes-title">Property Codes</h1>
          <p className="codes-count">
            {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'property' : 'properties'}${query ? ` matching "${query}"` : ''}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/codes/new')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Property
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg className="search-bar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by property name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-bar-clear" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      {/* Grid */}
      {loading && results.length === 0 ? (
        <div className="loading-spinner">
          <div className="spinner" />
          Loading properties…
        </div>
      ) : (
        <div className="prop-grid">
          {results.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏠</span>
              <h3>No properties found</h3>
              <p>{query ? `No results for "${query}"` : 'Add your first property to get started.'}</p>
              {query
                ? <button className="btn-secondary" onClick={() => setQuery('')}>Clear search</button>
                : <button className="btn-primary" onClick={() => navigate('/codes/new')}>Add Property</button>
              }
            </div>
          ) : results.map((prop) => (
            <div
              key={prop.id}
              className="prop-card"
              onClick={() => navigate(`/codes/${prop.id}`)}
            >
              <div className="prop-card-header">
                <div className="prop-card-name">{highlight(prop.name, query)}</div>
                {prop.codes.length > 0 && (
                  <span className="prop-card-badge">{prop.codes.length}</span>
                )}
              </div>

              <div className="prop-card-codes">
                {prop.codes.length === 0
                  ? <span className="no-codes-text">No codes yet</span>
                  : prop.codes.slice(0, 3).map((c, i) => (
                    <span key={i} className="code-chip">
                      <span className="code-chip-label">{c.label}:</span> {c.value}
                    </span>
                  ))
                }
                {prop.codes.length > 3 && (
                  <span className="code-chip code-chip-more">+{prop.codes.length - 3} more</span>
                )}
              </div>

              {prop.notes && (
                <div className="prop-card-notes">{prop.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
