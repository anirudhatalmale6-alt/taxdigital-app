import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { default as api } from '../api';

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
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.5',
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
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '2px 0 0 0',
  },
  otpContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  otpInput: {
    width: '48px',
    height: '56px',
    border: '1.5px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '22px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  otpInputFocus: {
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
  success: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
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
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#e5e7eb',
    transition: 'background 0.3s',
  },
  stepDotActive: {
    background: '#1a56db',
  },
  stepDotCompleted: {
    background: '#16a34a',
  },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP, 3 = new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [focusedField, setFocusedField] = useState('');

  // Step 1: Send reset code
  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('A 6-digit code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/verify-otp', { email, otp: otpValue });
      setResetToken(data.resetToken);
      setSuccessMsg('Code verified. Enter your new password.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword,
      });
      setSuccessMsg('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // OTP input handlers
  function handleOtpChange(index, value) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      // Focus the last filled or next empty input
      const focusIdx = Math.min(pasted.length, 5);
      const el = document.getElementById(`otp-${focusIdx}`);
      if (el) el.focus();
    }
  }

  function getInputStyle(fieldName) {
    return {
      ...styles.input,
      ...(focusedField === fieldName ? styles.inputFocus : {}),
    };
  }

  function getStepDotStyle(dotStep) {
    if (dotStep < step) return { ...styles.stepDot, ...styles.stepDotCompleted };
    if (dotStep === step) return { ...styles.stepDot, ...styles.stepDotActive };
    return styles.stepDot;
  }

  function getSubtitleText() {
    switch (step) {
      case 1:
        return "Enter your email and we'll send you a code to reset your password.";
      case 2:
        return `Enter the 6-digit code sent to ${email}`;
      case 3:
        return 'Choose a new password for your account.';
      default:
        return '';
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={styles.logoIcon}>
              <span style={styles.logoText}>T</span>
            </div>
          </div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>{getSubtitleText()}</p>
        </div>

        {/* Step Indicator */}
        <div style={styles.stepIndicator}>
          <div style={getStepDotStyle(1)} />
          <div style={getStepDotStyle(2)} />
          <div style={getStepDotStyle(3)} />
        </div>

        {/* Messages */}
        {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}
        {successMsg && <div style={{ ...styles.success, marginBottom: '16px' }}>{successMsg}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} style={styles.form}>
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
                autoFocus
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
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div style={styles.links}>
              <Link to="/login" style={styles.link}>
                Back to login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={{ ...styles.label, textAlign: 'center' }}>Verification Code</label>
              <div style={styles.otpContainer}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    onFocus={() => setFocusedField(`otp-${idx}`)}
                    onBlur={() => setFocusedField('')}
                    style={{
                      ...styles.otpInput,
                      ...(focusedField === `otp-${idx}` ? styles.otpInputFocus : {}),
                    }}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
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
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div style={styles.links}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  ...styles.link,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedField('newPassword')}
                onBlur={() => setFocusedField('')}
                style={getInputStyle('newPassword')}
                autoComplete="new-password"
                autoFocus
              />
              <p style={styles.hint}>Minimum 6 characters</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                style={getInputStyle('confirmPassword')}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div style={styles.links}>
              <Link to="/login" style={styles.link}>
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
