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
    gap: '18px',
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
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '2px 0 0 0',
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
};

export default function Register() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Please enter your company name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        email,
        password,
        companyName,
      });

      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <p style={styles.subtitle}>Create your account</p>
        </div>

        {/* Error */}
        {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Company Name</label>
            <input
              type="text"
              placeholder="Your Company Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onFocus={() => setFocusedField('company')}
              onBlur={() => setFocusedField('')}
              style={getInputStyle('company')}
              autoComplete="organization"
            />
          </div>

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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              style={getInputStyle('password')}
              autoComplete="new-password"
            />
            <p style={styles.hint}>Minimum 6 characters</p>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField('')}
              style={getInputStyle('confirm')}
              autoComplete="new-password"
            />
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div style={styles.links}>
            <span style={styles.linkMuted}>
              Already have an account?{' '}
              <Link to="/login" style={styles.link}>
                Log in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
