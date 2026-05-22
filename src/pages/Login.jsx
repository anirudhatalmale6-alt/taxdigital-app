import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { default as api, setToken, setUser } from '../api';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    padding: '20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  logoText: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  tagline: {
    fontSize: '14px',
    color: '#1a56db',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#1a56db',
    boxShadow: '0 0 0 3px rgba(26, 86, 219, 0.1)',
  },
  button: {
    padding: '13px',
    background: '#1a56db',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  buttonDisabled: {
    background: '#93b4f5',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  links: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  link: {
    color: '#1a56db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  linkMuted: {
    color: '#6b7280',
    fontSize: '14px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0',
  },
  companyOption: {
    padding: '14px 16px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  companyOptionHover: {
    borderColor: '#1a56db',
    background: '#eff6ff',
  },
  companyIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    flexShrink: 0,
  },
  companyName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
  },
  forgotRow: {
    textAlign: 'right',
    marginTop: '-12px',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  // Company picker state
  const [companies, setCompanies] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [hoveredCompany, setHoveredCompany] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });

      // If multiple companies, show picker
      if (data.companies && data.companies.length > 1) {
        setCompanies(data.companies);
        setPendingUser(data.user);
        setPendingToken(data.token);
        setLoading(false);
        return;
      }

      // Single company or no picker needed
      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function selectCompany(company) {
    setLoading(true);
    setError('');
    try {
      // Re-login with the selected companyId
      const data = await api.post('/auth/login', {
        email,
        password,
        companyId: company.id || company._id,
      });

      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to select company.');
    } finally {
      setLoading(false);
    }
  }

  function getInputStyle(fieldName) {
    return {
      ...styles.input,
      ...(focusedField === fieldName ? styles.inputFocus : {}),
    };
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Tax Digital" style={{ maxWidth: '220px', height: 'auto', marginBottom: '8px' }} />
          </div>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Error */}
        {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              style={getInputStyle('email')}
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              style={getInputStyle('password')}
              autoComplete="current-password"
            />
          </div>

          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = '#1648b8';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = '#1a56db';
            }}
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          <div style={styles.links}>
            <span style={styles.linkMuted}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </div>

      {/* Company Picker Modal */}
      {companies && (
        <div style={styles.overlay} onClick={() => setCompanies(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Select a Company</h2>
            <p style={styles.modalSubtitle}>
              Your account is linked to multiple companies. Choose one to continue.
            </p>
            {companies.map((company) => {
              const companyId = company.id || company._id;
              const name = company.companyName || company.name || 'Unnamed Company';
              const initial = name.charAt(0).toUpperCase();
              const isHovered = hoveredCompany === companyId;
              return (
                <div
                  key={companyId}
                  style={{
                    ...styles.companyOption,
                    ...(isHovered ? styles.companyOptionHover : {}),
                  }}
                  onMouseEnter={() => setHoveredCompany(companyId)}
                  onMouseLeave={() => setHoveredCompany(null)}
                  onClick={() => selectCompany(company)}
                >
                  <div style={styles.companyIcon}>{initial}</div>
                  <span style={styles.companyName}>{name}</span>
                </div>
              );
            })}
            <button
              style={{
                ...styles.button,
                background: 'transparent',
                color: '#6b7280',
                marginTop: '8px',
                width: '100%',
                border: '1.5px solid #e5e7eb',
              }}
              onClick={() => setCompanies(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
