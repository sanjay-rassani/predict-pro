import pool from './pool.js';

// Fixed external ids so re-running is idempotent (upsert by external_api_id).
const DEMO_EXTERNAL_IDS = [900001, 900002, 900003, 900004, 900005, 900006];

function hoursFromNow(h) {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

const premierLeagueStandings = [
  { rank: 1, team: { name: 'Arsenal' }, points: 52 },
  { rank: 2, team: { name: 'Man City' }, points: 50 },
  { rank: 3, team: { name: 'Liverpool' }, points: 48 },
  { rank: 4, team: { name: 'Chelsea' }, points: 41 },
  { rank: 5, team: { name: 'Tottenham' }, points: 39 },
  { rank: 6, team: { name: 'Man United' }, points: 37 },
];

// league_id/standings are only attached where useful for the demo.
const MATCHES = [
  {
    ext: 900001, home: 'Arsenal', away: 'Chelsea', league: 'Premier League', leagueId: 39,
    market: 'England', when: hoursFromNow(-1), status: '2H', homeScore: 2, awayScore: 1,
    minute: 67, homePos: 1, awayPos: 4, standings: premierLeagueStandings,
  },
  {
    ext: 900002, home: 'Barcelona', away: 'Real Madrid', league: 'La Liga', leagueId: 140,
    market: 'Spain', when: hoursFromNow(-1), status: 'HT', homeScore: 0, awayScore: 1,
    minute: 45, htHome: 0, htAway: 1,
  },
  {
    ext: 900003, home: 'Bayern Munich', away: 'Dortmund', league: 'Bundesliga', leagueId: 78,
    market: 'Germany', when: hoursFromNow(-1), status: '1H', homeScore: 1, awayScore: 1,
    minute: 30,
  },
  {
    ext: 900004, home: 'Liverpool', away: 'Man City', league: 'Premier League', leagueId: 39,
    market: 'England', when: hoursFromNow(4), status: 'NS', homeScore: 0, awayScore: 0,
    homePos: 3, awayPos: 2, standings: premierLeagueStandings,
  },
  {
    ext: 900005, home: 'PSG', away: 'Marseille', league: 'Ligue 1', leagueId: 61,
    market: 'France', when: hoursFromNow(28), status: 'NS', homeScore: 0, awayScore: 0,
  },
  {
    ext: 900006, home: 'Inter', away: 'Juventus', league: 'Serie A', leagueId: 135,
    market: 'Italy', when: hoursFromNow(52), status: 'NS', homeScore: 0, awayScore: 0,
  },
];

async function upsertMatch(m) {
  const { rows } = await pool.query(
    `INSERT INTO matches (
       external_api_id, home_team, away_team, league, league_id, market,
       match_datetime, published, home_position, away_position, standings_data, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9, $10, NOW())
     ON CONFLICT (external_api_id) DO UPDATE SET
       home_team = EXCLUDED.home_team,
       away_team = EXCLUDED.away_team,
       league = EXCLUDED.league,
       league_id = EXCLUDED.league_id,
       market = EXCLUDED.market,
       match_datetime = EXCLUDED.match_datetime,
       published = TRUE,
       home_position = EXCLUDED.home_position,
       away_position = EXCLUDED.away_position,
       standings_data = EXCLUDED.standings_data,
       updated_at = NOW()
     RETURNING id`,
    [
      m.ext, m.home, m.away, m.league, m.leagueId, m.market, m.when,
      m.homePos ?? null, m.awayPos ?? null,
      m.standings ? JSON.stringify(m.standings) : null,
    ],
  );
  const matchId = rows[0].id;

  const liveOdds = {
    bookmaker: 'Demo',
    market: 'Match Winner',
    values: { Home: 2.1, Draw: 3.3, Away: 3.6 },
    updatedAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO live_scores (
       match_id, home_score, away_score, current_minute,
       halftime_home_score, halftime_away_score, match_status, live_odds, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (match_id) DO UPDATE SET
       home_score = EXCLUDED.home_score,
       away_score = EXCLUDED.away_score,
       current_minute = EXCLUDED.current_minute,
       halftime_home_score = EXCLUDED.halftime_home_score,
       halftime_away_score = EXCLUDED.halftime_away_score,
       match_status = EXCLUDED.match_status,
       live_odds = EXCLUDED.live_odds,
       updated_at = NOW()`,
    [
      matchId, m.homeScore ?? 0, m.awayScore ?? 0, m.minute ?? null,
      m.htHome ?? null, m.htAway ?? null, m.status, JSON.stringify(liveOdds),
    ],
  );

  return matchId;
}

async function insertPrediction(matchId, p) {
  await pool.query(
    `INSERT INTO predictions (
       match_id, type, predicted_value, odds, confidence_score, notes,
       is_automated_signal, approval_status, publish_status, result_status,
       odds_snapshot, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, $4, NOW(), NOW())`,
    [
      matchId, p.type, p.value, p.odds ?? null, p.confidence ?? null, p.notes ?? null,
      p.automated ?? false, 'approved', p.result ?? 'pending',
    ],
  );
}

export async function seedDemoData() {
  const ids = {};
  for (const m of MATCHES) {
    ids[m.ext] = await upsertMatch(m);
  }
  const matchIds = Object.values(ids);

  // Clear previous demo predictions so re-runs stay clean.
  await pool.query('DELETE FROM predictions WHERE match_id = ANY($1)', [matchIds]);

  // Manual predictions (1X2 + Under/Over) with a mix of results for filter testing.
  const manual = [
    { ext: 900001, type: '1X2', value: '1', odds: 2.10, confidence: 72, result: 'win' },
    { ext: 900001, type: 'UnderOver', value: 'Over 2.5', odds: 1.85, confidence: 65, result: 'win' },
    { ext: 900002, type: '1X2', value: 'X', odds: 3.40, confidence: 55, result: 'loss' },
    { ext: 900003, type: 'UnderOver', value: 'Over 2.5', odds: 1.75, confidence: 70, result: 'win' },
    { ext: 900004, type: '1X2', value: '1', odds: 1.95, confidence: 68, result: 'pending' },
    { ext: 900004, type: 'UnderOver', value: 'Under 2.5', odds: 2.05, confidence: 60, result: 'pending' },
    { ext: 900005, type: '1X2', value: '2', odds: 2.60, confidence: 58, result: 'loss' },
    { ext: 900006, type: '1X2', value: '1', odds: 2.20, confidence: 63, result: 'pending' },
  ];

  // Automated signals (Surprise + Comeback), approved & published, mixed results.
  const signals = [
    { ext: 900001, type: 'Surprise', value: 'Home win (surprise odds)', odds: 4.50, result: 'win', notes: 'Automated Surprise: home odds 4.50 > 4.00' },
    { ext: 900002, type: 'Comeback', value: 'Home comeback', odds: 5.00, result: 'loss', notes: 'Automated Comeback: home losing by 1 at halftime' },
    { ext: 900003, type: 'Surprise', value: 'Home win (surprise odds)', odds: 4.20, result: 'pending', notes: 'Automated Surprise: home odds 4.20 > 4.00' },
    { ext: 900004, type: 'Comeback', value: 'Home comeback', odds: 4.80, result: 'win', notes: 'Automated Comeback signal' },
    { ext: 900005, type: 'Surprise', value: 'Home win (surprise odds)', odds: 6.00, result: 'win', notes: 'Automated Surprise: home odds 6.00 > 4.00' },
    { ext: 900006, type: 'Comeback', value: 'Home comeback', odds: 4.10, result: 'loss', notes: 'Automated Comeback signal' },
  ];

  for (const p of manual) {
    await insertPrediction(ids[p.ext], { ...p, automated: false });
  }
  for (const s of signals) {
    await insertPrediction(ids[s.ext], { ...s, automated: true });
  }

  console.log(
    `[demo-data] Seeded ${MATCHES.length} matches, ${manual.length} manual predictions, ${signals.length} automated signals`,
  );

  return { matches: MATCHES.length, predictions: manual.length, signals: signals.length };
}

export { DEMO_EXTERNAL_IDS };
