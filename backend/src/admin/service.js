import pool from '../db/pool.js';
import config from '../config/index.js';
import { toCsv } from '../utils/csv.js';
import * as predictionService from '../predictions/service.js';
import * as apiFootball from '../matches/apiFootball.js';

const runtimeSettings = {
  notificationsEnabled: config.fcmEnabled,
};

export function getSettings() {
  return {
    notificationsEnabled: runtimeSettings.notificationsEnabled,
    apiHealth: getApiHealth(),
  };
}

export function updateSettings({ notificationsEnabled }) {
  if (typeof notificationsEnabled === 'boolean') {
    runtimeSettings.notificationsEnabled = notificationsEnabled;
  }
  return getSettings();
}

export function areNotificationsEnabled() {
  return runtimeSettings.notificationsEnabled;
}

export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [matchesToday, liveMatches, publishedPredictions, pendingSignals, premiumUsers] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM matches WHERE match_datetime::date = $1::date`,
        [today],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM live_scores
         WHERE match_status IN ('1H', '2H', 'HT', 'ET', 'P', 'LIVE')`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM predictions WHERE publish_status = 'published'`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM predictions
         WHERE is_automated_signal = TRUE AND approval_status = 'pending'`,
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'premium'`),
    ]);

  return {
    todaysMatches: matchesToday.rows[0].count,
    liveMatches: liveMatches.rows[0].count,
    publishedPredictions: publishedPredictions.rows[0].count,
    pendingSignals: pendingSignals.rows[0].count,
    premiumUsers: premiumUsers.rows[0].count,
  };
}

export async function exportPredictionsCsv(filters) {
  const rows = await predictionService.listForExport(filters);
  return toCsv(rows, [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'home_team', label: 'Home Team' },
    { key: 'away_team', label: 'Away Team' },
    { key: 'league', label: 'League' },
    { key: 'predicted_value', label: 'Prediction' },
    { key: 'odds', label: 'Odds' },
    { key: 'confidence_score', label: 'Confidence' },
    { key: 'publish_status', label: 'Publish Status' },
    { key: 'result_status', label: 'Result' },
    { key: 'match_datetime', label: 'Match Date' },
    { key: 'created_at', label: 'Created At' },
  ]);
}

export async function exportSignalHistoryCsv(filters) {
  const rows = await listSignalHistory({ ...filters, forExport: true });
  return toCsv(rows, [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Signal Type' },
    { key: 'home_team', label: 'Home Team' },
    { key: 'away_team', label: 'Away Team' },
    { key: 'league', label: 'League' },
    { key: 'predicted_value', label: 'Prediction' },
    { key: 'odds', label: 'Odds' },
    { key: 'result_status', label: 'Result' },
    { key: 'created_at', label: 'Created At' },
  ]);
}

function resolvePeriodFilter(period) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (period === 'today') {
    return { from: startOfToday.toISOString() };
  }
  if (period === '7d') {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString() };
  }
  if (period === '30d') {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString() };
  }
  return {};
}

export async function listSignalHistory(filters = {}) {
  const { period, league, forExport = false } = filters;
  const { from } = resolvePeriodFilter(period);

  const conditions = [
    `p.is_automated_signal = TRUE`,
    `p.approval_status = 'approved'`,
    `p.publish_status = 'published'`,
    `p.type IN ('Surprise', 'Comeback')`,
  ];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`p.created_at >= $${params.length}::timestamptz`);
  }
  if (league) {
    params.push(`%${league}%`);
    conditions.push(`m.league ILIKE $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT p.*, m.home_team, m.away_team, m.league, m.match_datetime
     FROM predictions p
     JOIN matches m ON m.id = p.match_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC`,
    params,
  );

  if (forExport) return rows;

  const summary = {
    total: rows.length,
    wins: rows.filter((r) => r.result_status === 'win').length,
    losses: rows.filter((r) => r.result_status === 'loss').length,
    byType: {},
  };

  for (const type of ['Surprise', 'Comeback']) {
    const typed = rows.filter((r) => r.type === type);
    const wins = typed.filter((r) => r.result_status === 'win').length;
    const losses = typed.filter((r) => r.result_status === 'loss').length;
    const resolved = wins + losses;
    summary.byType[type] = {
      total: typed.length,
      wins,
      losses,
      successRate: resolved > 0 ? Math.round((wins / resolved) * 100) : null,
    };
  }

  const resolvedTotal = summary.wins + summary.losses;
  summary.successRate = resolvedTotal > 0 ? Math.round((summary.wins / resolvedTotal) * 100) : null;

  return { signals: rows, summary };
}

export function getApiHealth() {
  return {
    apiFootballConfigured: Boolean(config.apiFootballKey),
    apiUsage: apiFootball.getApiUsage(),
  };
}
