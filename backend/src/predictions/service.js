import pool from '../db/pool.js';
import { badRequest, notFound } from '../utils/errors.js';
import { snapshotOddsOnPublish } from '../live/service.js';
import { notifySignalApproved } from '../fcm/service.js';
import { emitSignalApproved } from '../socket/index.js';

const PREDICTION_TYPES = ['1X2', 'DoubleChance', 'UnderOver', 'Surprise', 'Comeback'];
const MANUAL_TYPES = ['1X2', 'DoubleChance', 'UnderOver'];

function validateManualType(type) {
  if (!MANUAL_TYPES.includes(type)) {
    throw badRequest(`type must be one of: ${MANUAL_TYPES.join(', ')}`);
  }
}

function normalizePublishStatus(body) {
  const status = body.publish_status ?? 'draft';
  if (!['draft', 'published'].includes(status)) {
    throw badRequest('publish_status must be draft or published');
  }
  return status;
}

function manualDefaults(publishStatus) {
  return {
    is_automated_signal: false,
    approval_status: publishStatus === 'published' ? 'approved' : 'pending',
    publish_status: publishStatus,
  };
}

export async function createPrediction(body) {
  const { match_id, type, predicted_value, odds, confidence_score, notes } = body;

  if (!match_id || !type || !predicted_value) {
    throw badRequest('match_id, type, and predicted_value are required');
  }

  validateManualType(type);
  const publishStatus = normalizePublishStatus(body);
  const defaults = manualDefaults(publishStatus);

  const { rows } = await pool.query(
    `INSERT INTO predictions (
      match_id, type, predicted_value, odds, confidence_score, notes,
      is_automated_signal, approval_status, publish_status,
      odds_snapshot
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      match_id,
      type,
      predicted_value,
      odds ?? null,
      confidence_score ?? null,
      notes ?? null,
      defaults.is_automated_signal,
      defaults.approval_status,
      defaults.publish_status,
      publishStatus === 'published' ? (odds ?? null) : null,
    ],
  );
  return rows[0];
}

export async function listPredictions(filters = {}, { includeArchived = false } = {}) {
  const { type, publish_status, approval_status, match_id } = filters;
  const conditions = [];
  const params = [];

  if (!includeArchived && !publish_status) {
    conditions.push(`p.publish_status != 'archived'`);
  }
  if (type) {
    params.push(type);
    conditions.push(`p.type = $${params.length}`);
  }
  if (publish_status) {
    params.push(publish_status);
    conditions.push(`p.publish_status = $${params.length}`);
  }
  if (approval_status) {
    params.push(approval_status);
    conditions.push(`p.approval_status = $${params.length}`);
  }
  if (match_id) {
    params.push(Number(match_id));
    conditions.push(`p.match_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.*, m.home_team, m.away_team, m.league, m.match_datetime,
            COALESCE(p.odds_snapshot, p.odds) AS odds_display
     FROM predictions p
     JOIN matches m ON m.id = p.match_id
     ${where}
     ORDER BY p.created_at DESC`,
    params,
  );
  return rows;
}

export async function getPredictionById(id) {
  const { rows } = await pool.query(
    `SELECT p.*, m.home_team, m.away_team, m.league
     FROM predictions p
     JOIN matches m ON m.id = p.match_id
     WHERE p.id = $1`,
    [id],
  );
  if (rows.length === 0) throw notFound('Prediction not found');
  return rows[0];
}

export async function updatePrediction(id, body) {
  const existing = await getPredictionById(id);
  if (existing.publish_status === 'archived') {
    throw badRequest('Cannot edit archived prediction');
  }

  const fields = ['type', 'predicted_value', 'odds', 'confidence_score', 'notes'];
  const updates = [];
  const params = [id];

  for (const field of fields) {
    if (body[field] !== undefined) {
      if (field === 'type') validateManualType(body[field]);
      params.push(body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    throw badRequest('No fields to update');
  }

  updates.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE predictions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  );
  return rows[0];
}

export async function publishPrediction(id) {
  const existing = await getPredictionById(id);
  if (existing.publish_status === 'archived') {
    throw badRequest('Cannot publish archived prediction');
  }

  const { rows } = await pool.query(
    `UPDATE predictions SET
      publish_status = 'published',
      approval_status = 'approved',
      is_automated_signal = FALSE,
      odds_snapshot = COALESCE(odds_snapshot, odds),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  const prediction = rows[0];
  await snapshotOddsOnPublish(prediction.id, prediction.odds_snapshot ?? prediction.odds);
  return prediction;
}

export async function archivePrediction(id) {
  const { rows } = await pool.query(
    `UPDATE predictions SET publish_status = 'archived', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  if (rows.length === 0) throw notFound('Prediction not found');
  return rows[0];
}

export async function approveSignal(id) {
  const existing = await getPredictionById(id);
  if (!existing.is_automated_signal) {
    throw badRequest('Only automated signals can be approved via queue');
  }
  if (existing.approval_status !== 'pending') {
    throw badRequest('Signal is not pending approval');
  }

  const { rows } = await pool.query(
    `UPDATE predictions SET
      approval_status = 'approved',
      publish_status = 'published',
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  const prediction = rows[0];
  const full = await getPredictionById(prediction.id);
  await notifySignalApproved(full);
  emitSignalApproved({
    predictionId: full.id,
    matchId: full.match_id,
    type: full.type,
    predictedValue: full.predicted_value,
    homeTeam: full.home_team,
    awayTeam: full.away_team,
    league: full.league,
    odds: full.odds,
  });
  return full;
}

export async function rejectSignal(id) {
  const existing = await getPredictionById(id);
  if (!existing.is_automated_signal) {
    throw badRequest('Only automated signals can be rejected via queue');
  }
  if (existing.approval_status !== 'pending') {
    throw badRequest('Signal is not pending approval');
  }

  const { rows } = await pool.query(
    `UPDATE predictions SET approval_status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}

export async function updateResultStatus(id, result_status) {
  if (!['pending', 'win', 'loss'].includes(result_status)) {
    throw badRequest('result_status must be pending, win, or loss');
  }
  const { rows } = await pool.query(
    `UPDATE predictions SET result_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, result_status],
  );
  if (rows.length === 0) throw notFound('Prediction not found');
  return rows[0];
}

export async function listForExport(filters = {}) {
  const { from, to, type, league } = filters;
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`m.match_datetime >= $${params.length}::timestamptz`);
  }
  if (to) {
    params.push(to);
    conditions.push(`m.match_datetime <= $${params.length}::timestamptz`);
  }
  if (type) {
    params.push(type);
    conditions.push(`p.type = $${params.length}`);
  }
  if (league) {
    params.push(`%${league}%`);
    conditions.push(`m.league ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.id, p.type, p.predicted_value, p.odds, p.confidence_score,
            p.publish_status, p.approval_status, p.result_status, p.created_at,
            m.home_team, m.away_team, m.league, m.match_datetime
     FROM predictions p
     JOIN matches m ON m.id = p.match_id
     ${where}
     ORDER BY p.created_at DESC`,
    params,
  );
  return rows;
}

export { PREDICTION_TYPES, MANUAL_TYPES };
