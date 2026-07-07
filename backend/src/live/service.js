import config from '../config/index.js';
import * as apiFootball from '../matches/apiFootball.js';
import pool from '../db/pool.js';
import { emitLiveOddsUpdate, emitLiveScoreUpdate, emitStandingsUpdate } from '../socket/index.js';
import { scanMatch } from '../scanner/service.js';

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT']);

export function extractMainOdds(oddsResponse) {
  if (!oddsResponse?.length) return null;

  for (const entry of oddsResponse) {
    const bookmaker = entry.bookmakers?.[0];
    const market = bookmaker?.bets?.find((b) => b.name === 'Match Winner' || b.id === 1);
    if (!market?.values?.length) continue;

    const odds = {};
    for (const v of market.values) {
      odds[v.value] = Number(v.odd);
    }
    return {
      bookmaker: bookmaker.name,
      market: market.name,
      values: odds,
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

export async function upsertLiveScoreFromFixture(fixture, matchRow) {
  const halftime = fixture.score?.halftime ?? {};
  const payload = {
    matchId: matchRow.id,
    externalApiId: matchRow.external_api_id,
    homeTeam: matchRow.home_team,
    awayTeam: matchRow.away_team,
    league: matchRow.league,
    leagueId: matchRow.league_id,
    homeScore: fixture.goals?.home ?? 0,
    awayScore: fixture.goals?.away ?? 0,
    currentMinute: fixture.fixture?.status?.elapsed ?? null,
    halftimeHomeScore: halftime.home ?? null,
    halftimeAwayScore: halftime.away ?? null,
    matchStatus: fixture.fixture?.status?.short ?? null,
    homeTeamLogoUrl: fixture.teams?.home?.logo ?? null,
    awayTeamLogoUrl: fixture.teams?.away?.logo ?? null,
  };

  await pool.query(
    `UPDATE live_scores SET
      home_score = $2, away_score = $3, current_minute = $4,
      halftime_home_score = $5, halftime_away_score = $6,
      match_status = $7, home_team_logo_url = $8, away_team_logo_url = $9,
      updated_at = NOW()
     WHERE match_id = $1`,
    [
      matchRow.id,
      payload.homeScore,
      payload.awayScore,
      payload.currentMinute,
      payload.halftimeHomeScore,
      payload.halftimeAwayScore,
      payload.matchStatus,
      payload.homeTeamLogoUrl,
      payload.awayTeamLogoUrl,
    ],
  );

  emitLiveScoreUpdate(payload);
  return payload;
}

export async function updateLiveOdds(matchId, externalApiId, liveOdds) {
  if (!liveOdds) return null;

  await pool.query(
    `UPDATE live_scores SET live_odds = $2, updated_at = NOW() WHERE match_id = $1`,
    [matchId, JSON.stringify(liveOdds)],
  );

  const payload = { matchId, externalApiId, liveOdds };
  emitLiveOddsUpdate(payload);
  return payload;
}

export async function fetchAndStoreStandings(leagueId, season = new Date().getFullYear()) {
  if (!config.apiFootballKey || !leagueId) return null;

  const data = await apiFootball.apiFootballFetch('/standings', { league: leagueId, season });
  const standings = data.response?.[0]?.league?.standings?.[0] ?? [];

  await pool.query(
    `UPDATE matches SET standings_data = $2, updated_at = NOW()
     WHERE league_id = $1 AND standings_data IS DISTINCT FROM $2::jsonb`,
    [leagueId, JSON.stringify(standings)],
  );

  for (const row of standings) {
    const teamId = row.team?.id;
    if (!teamId) continue;
    await pool.query(
      `UPDATE matches SET
        home_position = CASE WHEN home_team = $3 THEN $2 ELSE home_position END,
        away_position = CASE WHEN away_team = $3 THEN $2 ELSE away_position END
       WHERE league_id = $1 AND (home_team = $3 OR away_team = $3)`,
      [leagueId, row.rank, row.team.name],
    );
  }

  const payload = { leagueId, season, standings, updatedAt: new Date().toISOString() };
  emitStandingsUpdate(payload);
  return payload;
}

export async function pollLiveFromApi() {
  const fixtures = await apiFootball.apiFootballFetch('/fixtures', { live: 'all' });
  const liveFixtures = fixtures.response ?? [];
  const leagueIds = new Set();

  for (const fixture of liveFixtures) {
    const externalId = fixture.fixture.id;
    const { rows } = await pool.query('SELECT * FROM matches WHERE external_api_id = $1', [
      externalId,
    ]);
    if (rows.length === 0) continue;

    const match = rows[0];
    const scorePayload = await upsertLiveScoreFromFixture(fixture, match);

    if (match.league_id) leagueIds.add(match.league_id);

    let liveOdds = null;
    try {
      const oddsData = await apiFootball.fetchFixtureOdds(externalId);
      liveOdds = extractMainOdds(oddsData);
      await updateLiveOdds(match.id, externalId, liveOdds);
    } catch {
      // odds may be unavailable for some fixtures
    }

    const flagged = await scanMatch(match, scorePayload, liveOdds);
    if (flagged.length > 0) {
      console.log(`[scanner] Flagged ${flagged.length} signal(s) for match ${match.id}`);
    }
  }

  for (const leagueId of leagueIds) {
    try {
      await fetchAndStoreStandings(leagueId);
    } catch {
      // standings fetch is best-effort per poll
    }
  }

  return { liveCount: liveFixtures.length, leaguesUpdated: leagueIds.size };
}

let demoMinute = 0;

export async function pollLiveDemo() {
  const { rows } = await pool.query(
    `SELECT m.*, ls.home_score, ls.away_score, ls.current_minute, ls.match_status
     FROM matches m
     JOIN live_scores ls ON ls.match_id = m.id
     WHERE m.external_api_id = 999001`,
  );

  if (rows.length === 0) return { demo: true, updated: 0 };

  const match = rows[0];
  demoMinute = Math.min((match.current_minute ?? 0) + 1, 90);

  let homeScore = match.home_score ?? 0;
  let awayScore = match.away_score ?? 0;
  let status = '1H';

  // Demo scenarios for scanner (Section 4)
  if (demoMinute === 20) {
    homeScore = 0;
    awayScore = 0;
    status = '1H';
  } else if (demoMinute === 45) {
    homeScore = 0;
    awayScore = 1;
    status = 'HT';
  } else if (demoMinute > 45 && demoMinute < 90) {
    homeScore = 0;
    awayScore = 1;
    status = '2H';
  } else if (demoMinute >= 90) {
    status = 'FT';
  } else {
    homeScore = (match.home_score ?? 0) + (demoMinute % 15 === 0 ? 1 : 0);
  }

  const fixture = {
    fixture: { status: { short: status, elapsed: demoMinute } },
    goals: { home: homeScore, away: awayScore },
    score: {
      halftime: { home: status === 'HT' ? homeScore : 0, away: status === 'HT' ? awayScore : 0 },
    },
    teams: { home: { logo: null }, away: { logo: null } },
  };

  const scorePayload = await upsertLiveScoreFromFixture(fixture, match);

  const homeOddsValue = demoMinute >= 20 && demoMinute < 45 ? 4.5 : 2.1 + demoMinute * 0.01;
  const liveOdds = {
    bookmaker: 'Demo',
    market: 'Match Winner',
    values: { Home: homeOddsValue, Draw: 3.4, Away: 3.8 - demoMinute * 0.005 },
    updatedAt: new Date().toISOString(),
  };
  await updateLiveOdds(match.id, match.external_api_id, liveOdds);

  const flagged = await scanMatch(match, scorePayload, liveOdds);

  if (match.league_id && match.standings_data) {
    emitStandingsUpdate({
      leagueId: match.league_id,
      season: new Date().getFullYear(),
      standings: match.standings_data,
      updatedAt: new Date().toISOString(),
    });
  } else if (match.league_id) {
    const demoStandings = [
      { rank: 3, team: { name: match.home_team }, points: 45 },
      { rank: 7, team: { name: match.away_team }, points: 38 },
    ];
    await pool.query(`UPDATE matches SET standings_data = $2 WHERE id = $1`, [
      match.id,
      JSON.stringify(demoStandings),
    ]);
    emitStandingsUpdate({
      leagueId: match.league_id,
      season: new Date().getFullYear(),
      standings: demoStandings,
      updatedAt: new Date().toISOString(),
    });
  }

  return { demo: true, updated: 1, matchId: match.id, flagged: flagged.length };
}

export async function runLivePoll() {
  if (config.apiFootballKey && !config.liveDemoMode) {
    return pollLiveFromApi();
  }
  return pollLiveDemo();
}

export async function snapshotOddsOnPublish(predictionId, odds) {
  const snapshot = odds ?? null;
  await pool.query(
    `UPDATE predictions SET odds_snapshot = COALESCE($2, odds), updated_at = NOW() WHERE id = $1`,
    [predictionId, snapshot],
  );
}

export function isLiveStatus(status) {
  return LIVE_STATUSES.has(status);
}
