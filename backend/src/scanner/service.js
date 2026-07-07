import pool from '../db/pool.js';

const SURPRISE_ODDS_THRESHOLD = 4.0;

function getHomeOdds(liveOdds) {
  if (!liveOdds?.values) return null;
  const v = liveOdds.values;
  return v.Home ?? v.home ?? v['1'] ?? null;
}

export function shouldFlagSurprise(liveOdds) {
  const homeOdds = getHomeOdds(liveOdds);
  return homeOdds !== null && Number(homeOdds) > SURPRISE_ODDS_THRESHOLD;
}

export function shouldFlagComeback(liveScore) {
  const home = liveScore.homeScore ?? liveScore.home_score ?? 0;
  const away = liveScore.awayScore ?? liveScore.away_score ?? 0;
  const status = liveScore.matchStatus ?? liveScore.match_status;
  const homeLosingByOne = away - home === 1;
  return homeLosingByOne && status === 'HT';
}

async function hasExistingSignal(matchId, type) {
  const { rows } = await pool.query(
    `SELECT id FROM predictions
     WHERE match_id = $1 AND type = $2 AND is_automated_signal = TRUE
       AND approval_status IN ('pending', 'approved')`,
    [matchId, type],
  );
  return rows.length > 0;
}

async function createPendingSignal(match, type, { predicted_value, odds, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO predictions (
      match_id, type, predicted_value, odds, confidence_score, notes,
      is_automated_signal, approval_status, publish_status, result_status
    ) VALUES ($1, $2, $3, $4, NULL, $5, TRUE, 'pending', 'draft', 'pending')
    RETURNING *`,
    [match.id, type, predicted_value, odds ?? null, notes ?? null],
  );
  return rows[0];
}

export async function scanMatch(match, liveScore, liveOdds) {
  const flagged = [];

  if (shouldFlagSurprise(liveOdds)) {
    const exists = await hasExistingSignal(match.id, 'Surprise');
    if (!exists) {
      const homeOdds = getHomeOdds(liveOdds);
      const signal = await createPendingSignal(match, 'Surprise', {
        predicted_value: 'Home win (surprise odds)',
        odds: homeOdds,
        notes: `Automated Surprise: home odds ${homeOdds} > ${SURPRISE_ODDS_THRESHOLD}`,
      });
      flagged.push(signal);
    }
  }

  if (shouldFlagComeback(liveScore)) {
    const exists = await hasExistingSignal(match.id, 'Comeback');
    if (!exists) {
      const homeOdds = getHomeOdds(liveOdds);
      const signal = await createPendingSignal(match, 'Comeback', {
        predicted_value: 'Home comeback',
        odds: homeOdds,
        notes: 'Automated Comeback: home losing by 1 at halftime',
      });
      flagged.push(signal);
    }
  }

  return flagged;
}

export { SURPRISE_ODDS_THRESHOLD };
