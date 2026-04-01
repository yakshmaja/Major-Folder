import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiLogIn, FiAlertTriangle } from 'react-icons/fi';

const API_URL = 'http://localhost:8000';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('firesight_token', data.access_token);
      localStorage.setItem('firesight_user', data.username);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated background elements */}
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>
      <div style={styles.bgOrb3}></div>

      <div style={styles.loginWrapper} className="animate-fade-in">
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🔥</div>
          <h1 style={styles.logoText}>FireSight</h1>
          <p style={styles.logoSubtext}>AI-Powered Forest Fire Risk Prediction</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formCard} className="glass-card">
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Sign in to access the dashboard</p>

            {error && (
              <div style={styles.errorBox}>
                <FiAlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="username">Username</label>
              <div style={styles.inputWrapper}>
                <FiUser style={styles.inputIcon} />
                <input
                  id="username"
                  type="text"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label className="input-label" htmlFor="password">Password</label>
              <div style={styles.inputWrapper}>
                <FiLock style={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={styles.loginBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  Sign In
                </>
              )}
            </button>

            <div style={styles.signupHint}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Don't have an account?{' '}
                <span
                  onClick={() => navigate('/signup')}
                  style={{ color: 'var(--accent-orange)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Sign Up
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
  loginWrapper: {
    width: '100%',
    maxWidth: '440px',
    padding: '20px',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '56px',
    marginBottom: '12px',
    filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.4))',
  },
  logoText: {
    fontSize: '36px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f97316, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  logoSubtext: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginTop: '6px',
  },
  form: {},
  formCard: {
    padding: '36px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  formSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginBottom: '28px',
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
    marginBottom: '20px',
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
  loginBtn: {
    width: '100%',
    marginTop: '8px',
    padding: '14px 28px',
    fontSize: '16px',
  },
  demoHint: {
    textAlign: 'center',
    marginTop: '16px',
  },
};
