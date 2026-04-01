import { FiThermometer, FiDroplet, FiWind, FiCloudRain, FiInfo } from 'react-icons/fi';

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  const items = [
    {
      icon: <FiThermometer size={20} />,
      label: 'Temperature',
      value: `${weather.temperature}°C`,
      color: '#ef4444',
    },
    {
      icon: <FiDroplet size={20} />,
      label: 'Humidity',
      value: `${weather.humidity}%`,
      color: '#3b82f6',
    },
    {
      icon: <FiWind size={20} />,
      label: 'Wind Speed',
      value: `${weather.wind_speed} m/s`,
      color: '#10b981',
    },
    {
      icon: <FiCloudRain size={20} />,
      label: 'Rainfall',
      value: `${weather.rainfall} mm`,
      color: '#8b5cf6',
    },
  ];

  return (
    <div style={styles.card} className="glass-card">
      <h3 style={styles.title}>🌦 Weather Conditions</h3>

      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.label} style={styles.item}>
            <div style={{ ...styles.iconWrap, background: `${item.color}15`, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div style={styles.value}>{item.value}</div>
              <div style={styles.label}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.source}>
        <FiInfo size={12} />
        <span>{weather.source || 'Unknown source'}</span>
      </div>

      {weather.description && (
        <div style={styles.description}>
          {weather.description}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    padding: '24px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 'var(--radius-md)',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
  },
  value: {
    fontSize: '16px',
    fontWeight: '700',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  source: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  description: {
    marginTop: '8px',
    padding: '8px 12px',
    background: 'rgba(15, 23, 42, 0.3)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize',
  },
};
