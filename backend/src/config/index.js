import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/predict_pro',
  ),
  jwtSecret: required('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: required('ADMIN_EMAIL', 'admin@predictpro.local'),
  adminPassword: required('ADMIN_PASSWORD', 'admin123'),
  apiFootballKey: process.env.API_FOOTBALL_KEY || '',
  apiFootballBaseUrl: process.env.API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  livePollIntervalMs: Number(process.env.LIVE_POLL_INTERVAL_MS) || 30_000,
  liveDemoMode: process.env.LIVE_DEMO_MODE === 'true' || !process.env.API_FOOTBALL_KEY,
  fcmEnabled: process.env.FCM_ENABLED === 'true',
  fcmServiceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || '',
};

export default config;
