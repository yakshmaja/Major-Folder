/**
 * API configuration for FireSight.
 * Uses localhost when running locally, Render URL when deployed.
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocal
  ? 'http://localhost:8000'
  : 'https://major-folder-2.onrender.com';
