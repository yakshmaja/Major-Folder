import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiUserPlus, FiAlertTriangle } from 'react-icons/fi';

import { API_URL } from '../config';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Auto-login after registration
      const loginRes = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        localStorage.setItem('firesight_token', loginData.access_token);
        localStorage.setItem('firesight_user', loginData.username);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>
      <div style={styles.bgOrb3}></div>

      <div style={styles.wrapper} className="animate-fade-in">
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🔥</div>
          <h1 style={styles.logoText}>FireSight</h1>
          <p style={styles.logoSubtext}>Create your account</p>
        </div>

        <form onSubmit={handleSignup} style={styles.form}>
          <div style={styles.formCard} className="glass-card">
            <h2 style={styles.formTitle}>Sign Up</h2>
            <p style={styles.formSubtitle}>Join FireSight to predict fire risks</p>

            {error && (
              <div style={styles.errorBox}>
                <FiAlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="name">Full Name</label>
              <div style={styles.inputWrapper}>
                <FiUser style={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="signup-username">Username</label>
              <div style={styles.inputWrapper}>
                <FiUser style={styles.inputIcon} />
                <input
                  id="signup-username"
                  type="text"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Choose a username (min 3 chars)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="signup-password">Password</label>
              <div style={styles.inputWrapper}>
                <FiLock style={styles.inputIcon} />
                <input
                  id="signup-password"
                  type="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Choose a password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
              <div style={styles.inputWrapper}>
                <FiLock style={styles.inputIcon} />
                <input
                  id="confirm-password"
                  type="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <FiUserPlus size={18} />
                  Create Account
                </>
              )}
            </button>

            <div style={styles.loginHint}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Already have an account?{' '}
                <span
                  onClick={() => navigate('/login')}
                  style={{ color: 'var(--accent-orange)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Sign In
                </span>
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
    top: '-150px',
    right: '-100px',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
    bottom: '-100px',
    left: '-100px',
    pointerEvents: 'none',
  },
  bgOrb3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  wrapper: {
    width: '100%',
    maxWidth: '440px',
    padding: '20px',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '8px',
    filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.4))',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f97316, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  logoSubtext: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginTop: '4px',
  },
  form: {},
  formCard: {
    padding: '32px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  formSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginBottom: '24px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: '42px',
  },
  submitBtn: {
    width: '100%',
    marginTop: '4px',
    padding: '14px 28px',
    fontSize: '16px',
  },
  loginHint: {
    textAlign: 'center',
    marginTop: '16px',
  },
};
