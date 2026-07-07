import { readFileSync } from 'fs';
import admin from 'firebase-admin';
import config from '../config/index.js';
import pool from '../db/pool.js';
import { areNotificationsEnabled } from '../admin/service.js';

let initialized = false;
const pushLog = [];

export function getPushLog() {
  return pushLog;
}

export function clearPushLog() {
  pushLog.length = 0;
}

function initFirebase() {
  if (initialized) return true;
  if (!config.fcmServiceAccountPath) return false;

  try {
    const serviceAccount = JSON.parse(readFileSync(config.fcmServiceAccountPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    initialized = true;
    return true;
  } catch (err) {
    console.error('[fcm] Failed to initialize Firebase:', err.message);
    return false;
  }
}

export async function registerDeviceToken(email, token, platform = 'unknown') {
  const { rows } = await pool.query('SELECT id, role FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    throw new Error('User not found');
  }

  const user = rows[0];
  await pool.query(
    `INSERT INTO device_tokens (user_id, token, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
    [user.id, token, platform],
  );
  return { userId: user.id, role: user.role };
}

export async function getPremiumDeviceTokens() {
  const { rows } = await pool.query(
    `SELECT dt.token FROM device_tokens dt
     JOIN users u ON u.id = dt.user_id
     WHERE u.role = 'premium'`,
  );
  return rows.map((r) => r.token);
}

export async function notifySignalApproved(prediction) {
  if (!areNotificationsEnabled()) {
    pushLog.push({ skipped: true, reason: 'notifications_disabled', predictionId: prediction.id });
    return { sent: 0, skipped: true };
  }

  const tokens = await getPremiumDeviceTokens();
  if (tokens.length === 0) {
    pushLog.push({ skipped: true, reason: 'no_premium_tokens', predictionId: prediction.id });
    return { sent: 0, skipped: true };
  }

  const title = `New ${prediction.type} signal`;
  const body = `${prediction.home_team ?? 'Match'}: ${prediction.predicted_value}`;

  if (initFirebase() && config.fcmEnabled) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        predictionId: String(prediction.id),
        type: prediction.type,
        matchId: String(prediction.match_id),
      },
    });
    pushLog.push({
      sent: response.successCount,
      failed: response.failureCount,
      predictionId: prediction.id,
      tokens: tokens.length,
    });
    return { sent: response.successCount, failed: response.failureCount };
  }

  // Dev/mock mode — log instead of sending when Firebase not configured
  pushLog.push({
    mock: true,
    title,
    body,
    tokens,
    predictionId: prediction.id,
  });
  console.log(`[fcm] Mock push to ${tokens.length} premium device(s): ${title}`);
  return { sent: tokens.length, mock: true };
}
