import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RISK_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
  0: '#10b981',
  1: '#f59e0b',
  2: '#f97316',
  3: '#ef4444',
};

const RISK_LABELS = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Critical',
};

// Component to fly to a location when query changes
function FlyToLocation({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 12, { duration: 1.5 });
    }
  }, [lat, lon, map]);
  return null;
}

// Custom large location pin icon for query location
const queryIcon = L.divIcon({
  className: '',
  html: `
    <div style="position: relative; width: 44px; height: 56px;">
      <div style="
        position: absolute;
        bottom: 0; left: 50%; transform: translateX(-50%);
        width: 14px; height: 6px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
      <svg viewBox="0 0 44 56" width="44" height="56" style="filter: drop-shadow(0 4px 8px rgba(239,68,68,0.5));">
        <path d="M22 0C10 0 0 10 0 22c0 16.5 22 34 22 34s22-17.5 22-34C44 10 34 0 22 0z" fill="#ef4444"/>
        <path d="M22 2C11 2 2 11 2 22c0 15.2 20 31.2 20 31.2S42 37.2 42 22C42 11 33 2 22 2z" fill="#dc2626"/>
        <circle cx="22" cy="20" r="9" fill="white"/>
        <circle cx="22" cy="20" r="5" fill="#ef4444"/>
      </svg>
      <div style="
        position: absolute;
        bottom: -4px; left: 50%; transform: translateX(-50%);
        width: 30px; height: 30px;
        border-radius: 50%;
        border: 3px solid rgba(239,68,68,0.6);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <style>
        @keyframes ping {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          75%, 100% { transform: translateX(-50%) scale(2.5); opacity: 0; }
        }
      </style>
    </div>
  `,
  iconSize: [44, 56],
  iconAnchor: [22, 56],
  popupAnchor: [0, -56],
});

export default function HeatMap({ locations = [], queryLocation, prediction }) {
  const center = [20, 0]; // World view center
  const zoom = 3;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={2}
      style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px' }}
      worldCopyJump={true}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* Dataset location markers */}
      {locations.map((loc, idx) => {
        const color = RISK_COLORS[loc.risk_level] || RISK_COLORS[loc.risk_label] || '#6b7280';
        const riskLabel = loc.risk_label || RISK_LABELS[loc.risk_level] || 'Unknown';

        return (
          <CircleMarker
            key={idx}
            center={[loc.latitude, loc.longitude]}
            radius={7}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.6,
              color: color,
              weight: 2,
              opacity: 0.8,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', color: '#e0e0e0' }}>
                <strong style={{ color: color, fontSize: '14px' }}>
                  {riskLabel} Risk
                </strong>
                {loc.name && (
                  <>
                    <br />
                    <span style={{ fontSize: '13px', color: '#ddd', fontWeight: '500' }}>
                      {loc.name}
                    </span>
                  </>
                )}
                <br />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </span>
                <br />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  🌡 {loc.temp?.toFixed(1)}°C | 💧 {loc.RH?.toFixed(0)}% | 💨 {loc.wind?.toFixed(1)} m/s
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Query location marker */}
      {queryLocation && (
        <>
          <FlyToLocation lat={queryLocation.lat} lon={queryLocation.lon} />
          <Marker position={[queryLocation.lat, queryLocation.lon]} icon={queryIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', color: '#e0e0e0' }}>
                <strong style={{ color: '#f97316', fontSize: '14px' }}>
                  🔍 Your Query Location
                </strong>
                <br />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  📍 {queryLocation.lat.toFixed(4)}, {queryLocation.lon.toFixed(4)}
                </span>
                {prediction && (
                  <>
                    <br />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: RISK_COLORS[prediction.risk_label] || '#f97316'
                    }}>
                      Risk: {prediction.risk_label} ({prediction.confidence}%)
                    </span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
