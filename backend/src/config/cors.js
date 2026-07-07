import config from './index.js';

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function isCorsOriginAllowed(origin) {
  if (!origin) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (config.nodeEnv === 'development' && config.corsAllowLocalhostInDev && LOCALHOST_ORIGIN.test(origin)) {
    return true;
  }
  return false;
}

export function corsOriginCallback(origin, callback) {
  if (isCorsOriginAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS blocked origin: ${origin}`));
}
