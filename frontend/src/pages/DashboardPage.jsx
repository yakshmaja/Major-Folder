import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiMail, FiSearch, FiLogOut, FiAlertCircle, FiWind, FiDroplet, FiThermometer, FiCloudRain } from 'react-icons/fi';
import HeatMap from '../components/HeatMap';
import WeatherCard from '../components/WeatherCard';
import PredictionForm from '../components/PredictionForm';

const API_URL = 'http://localhost:8000';

export default function DashboardPage() {
  const [prediction, setPrediction] = useState(null);
  const [weather, setWeather] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [queryLocation, setQueryLocation] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('firesight_token');
  const username = localStorage.getItem('firesight_user') || 'User';

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const fetchHeatmapData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/heatmap`, { headers: getHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
    }
  };

  const handlePredict = async (latitude, longitude, email) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ latitude, longitude, email }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Prediction failed');
      }

      const data = await res.json();
      setPrediction(data);
      setWeather(data.weather);
      setQueryLocation({ lat: latitude, lon: longitude });

      // Show toast about email status
      if (data.email_status?.success) {
        setToast({ type: 'success', message: `Alert email sent to ${email}` });
      } else {
        setToast({
          type: 'info',
          message: data.email_status?.message || 'Email notification skipped',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to get prediction');
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('firesight_token');
    localStorage.removeItem('firesight_user');
    navigate('/login');
  };

  const getRiskClass = (label) => {
    const classes = { Low: 'risk-low', Medium: 'risk-medium', High: 'risk-high', Critical: 'risk-critical' };
    return classes[label] || '';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>🔥</span>
          <h1 style={styles.headerTitle}>FireSight</h1>
          <span style={styles.headerBadge}>Dashboard</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.username}>👤 {username}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Left Panel - Form & Results */}
        <div style={styles.leftPanel}>
          <div className="animate-fade-in">
            <PredictionForm onSubmit={handlePredict} loading={loading} />
          </div>

          {error && (
            <div style={styles.errorBox} className="animate-fade-in">
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {weather && (
            <div className="animate-fade-in-delay-1">
              <WeatherCard weather={weather} />
            </div>
          )}

          {prediction && (
            <div style={styles.resultCard} className="glass-card animate-fade-in-delay-2">
              <h3 style={styles.sectionTitle}>🔍 Prediction Result</h3>

              <div style={styles.riskDisplay}>
                <span style={styles.riskLabel}>Risk Level</span>
                <div className={`risk-badge ${getRiskClass(prediction.risk_label)}`} style={{ fontSize: '18px', padding: '10px 24px' }}>
                  {prediction.risk_label}
                </div>
                <span style={styles.confidence}>
                  {prediction.confidence}% confidence
                </span>
              </div>

              <div style={styles.probGrid}>
                {prediction.probabilities && Object.entries(prediction.probabilities).map(([label, prob]) => (
                  <div key={label} style={styles.probItem}>
                    <div style={styles.probHeader}>
                      <span className={`risk-badge ${getRiskClass(label)}`} style={{ fontSize: '11px', padding: '3px 10px' }}>{label}</span>
                      <span style={styles.probValue}>{prob}%</span>
                    </div>
                    <div style={styles.probBarBg}>
                      <div style={{ ...styles.probBarFill, width: `${prob}%`, background: label === 'Critical' ? '#ef4444' : label === 'High' ? '#f97316' : label === 'Medium' ? '#f59e0b' : '#10b981' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {prediction.location && (
                <div style={styles.locationInfo}>
                  <FiMapPin size={14} style={{ color: 'var(--accent-orange)' }} />
                  <span>Lat: {prediction.location.latitude}, Lon: {prediction.location.longitude}</span>
                </div>
              )}

              {prediction.email_status && (
                <div style={{ ...styles.emailStatus, borderColor: prediction.email_status.success ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' }}>
                  <FiMail size={14} />
                  <span>{prediction.email_status.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Heatmap */}
        <div style={styles.rightPanel}>
          <div style={styles.mapCard} className="glass-card animate-fade-in-delay-1">
            <h3 style={styles.sectionTitle}>🗺️ Fire Risk Heatmap</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Color-coded risk levels — enter any global coordinates to predict fire risk
            </p>
            <div style={styles.mapContainer}>
              <HeatMap locations={heatmapData} queryLocation={queryLocation} prediction={prediction} />
            </div>
            <div style={styles.legend}>
              <span style={styles.legendTitle}>Risk Levels:</span>
              <span className="risk-badge risk-low" style={styles.legendBadge}>Low</span>
              <span className="risk-badge risk-medium" style={styles.legendBadge}>Medium</span>
              <span className="risk-badge risk-high" style={styles.legendBadge}>High</span>
              <span className="risk-badge risk-critical" style={styles.legendBadge}>Critical</span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: 'rgba(17, 24, 39, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerLogo: {
    fontSize: '28px',
    filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.4))',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f97316, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerBadge: {
    padding: '4px 12px',
    background: 'rgba(249,115,22,0.1)',
    border: '1px solid rgba(249,115,22,0.2)',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    color: 'var(--accent-orange)',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  username: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-full)',
    color: '#ef4444',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: '24px',
    padding: '24px 32px',
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 65px)',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
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
  },
  resultCard: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
    letterSpacing: '-0.3px',
  },
  riskDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
  },
  riskLabel: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: '500',
  },
  confidence: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  probGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  probItem: {},
  probHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  probValue: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '600',
  },
  probBarBg: {
    height: '6px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  probBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease-out',
  },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  emailStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  mapCard: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mapContainer: {
    flex: 1,
    minHeight: '500px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  legendTitle: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: '600',
  },
  legendBadge: {
    fontSize: '10px',
    padding: '3px 10px',
  },
};
