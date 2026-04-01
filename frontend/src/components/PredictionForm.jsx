import { useState } from 'react';
import { FiMapPin, FiMail, FiSearch } from 'react-icons/fi';

export default function PredictionForm({ onSubmit, loading }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return;
    }

    onSubmit(lat, lon, email);
  };

  return (
    <div style={styles.card} className="glass-card">
      <h3 style={styles.title}>
        <FiSearch size={18} style={{ color: 'var(--accent-orange)' }} />
        Predict Fire Risk
      </h3>
      <p style={styles.subtitle}>Enter location coordinates and your email</p>

      <form onSubmit={handleSubmit}>
        <div style={styles.coordRow}>
          <div style={styles.inputGroup}>
            <label className="input-label" htmlFor="latitude">
              <FiMapPin size={12} style={{ marginRight: '4px' }} />
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              className="input-field"
              placeholder="e.g. 41.82"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label className="input-label" htmlFor="longitude">
              <FiMapPin size={12} style={{ marginRight: '4px' }} />
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              className="input-field"
              placeholder="e.g. -6.63"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label className="input-label" htmlFor="email">
            <FiMail size={12} style={{ marginRight: '4px' }} />
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
              Analyzing...
            </>
          ) : (
            <>
              <FiSearch size={16} />
              Predict Risk
            </>
          )}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    padding: '24px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    marginBottom: '20px',
  },
  coordRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  submitBtn: {
    width: '100%',
    marginTop: '4px',
    padding: '14px',
  },
};
