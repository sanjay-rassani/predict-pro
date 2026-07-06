import pool from '../db/pool.js';
import { notFound } from '../utils/errors.js';
import * as apiFootball from './apiFootball.js';

function mapFixtureToMatch(fixture) {
  return {
    external_api_id: fixture.fixture.id,
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    league: fixture.league.name,
    league_id: fixture.league.id,
    market: fixture.league.country ?? null,
    match_datetime: new Date(fixture.fixture.date).toISOString(),
    home_team_logo_url: fixture.teams.home.logo,
    away_team_logo_url: fixture.teams.away.logo,
    match_status: fixture.fixture.status.short,
  };
}

export async function syncMatches({ date, league } = {}) {
  const fixtures = await apiFootball.fetchFixtures({ date, league });
  let imported = 0;

  for (const fixture of fixtures) {
    const m = mapFixtureToMatch(fixture);
    await pool.query(
      `INSERT INTO matches (
        external_api_id, home_team, away_team, league, league_id, market,
        match_datetime, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (external_api_id) DO UPDATE SET
        home_team = EXCLUDED.home_team,
        away_team = EXCLUDED.away_team,
        league = EXCLUDED.league,
        league_id = EXCLUDED.league_id,
        market = EXCLUDED.market,
        match_datetime = EXCLUDED.match_datetime,
        updated_at = NOW()`,
      [
        m.external_api_id,
        m.home_team,
        m.away_team,
        m.league,
        m.league_id,
        m.market,
        m.match_datetime,
      ],
    );

    await pool.query(
      `INSERT INTO live_scores (
        match_id, home_score, away_score, current_minute,
        match_status, home_team_logo_url, away_team_logo_url, updated_at
      )
      SELECT id, $2, $3, $4, $5, $6, $7, NOW()
      FROM matches WHERE external_api_id = $1
      ON CONFLICT (match_id) DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        current_minute = EXCLUDED.current_minute,
        match_status = EXCLUDED.match_status,
        home_team_logo_url = EXCLUDED.home_team_logo_url,
        away_team_logo_url = EXCLUDED.away_team_logo_url,
        updated_at = NOW()`,
      [
        m.external_api_id,
        fixture.goals.home ?? 0,
        fixture.goals.away ?? 0,
        fixture.fixture.status.elapsed,
        m.match_status,
        m.home_team_logo_url,
        m.away_team_logo_url,
      ],
    );

    imported += 1;
  }

  return { imported, total: fixtures.length };
}

export async function listMatches(filters = {}) {
  const { date, league, market, search, published } = filters;
  const conditions = [];
  const params = [];

  if (date) {
    params.push(date);
    conditions.push(`match_datetime::date = $${params.length}::date`);
  }
  if (league) {
    params.push(`%${league}%`);
    conditions.push(`league ILIKE $${params.length}`);
  }
  if (market) {
    params.push(`%${market}%`);
    conditions.push(`market ILIKE $${params.length}`);
  }
  if (published !== undefined) {
    params.push(published === 'true' || published === true);
    conditions.push(`published = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(`(home_team ILIKE $${idx} OR away_team ILIKE $${idx} OR league ILIKE $${idx})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT m.*,
            ls.home_score, ls.away_score, ls.current_minute, ls.match_status,
            ls.home_team_logo_url, ls.away_team_logo_url
     FROM matches m
     LEFT JOIN live_scores ls ON ls.match_id = m.id
     ${where}
     ORDER BY m.match_datetime ASC`,
    params,
  );
  return rows;
}

export async function getMatchById(id) {
  const { rows } = await pool.query(
    `SELECT m.*,
            ls.home_score, ls.away_score, ls.current_minute,
            ls.halftime_home_score, ls.halftime_away_score,
            ls.match_status, ls.home_team_logo_url, ls.away_team_logo_url
     FROM matches m
     LEFT JOIN live_scores ls ON ls.match_id = m.id
     WHERE m.id = $1`,
    [id],
  );
  if (rows.length === 0) throw notFound('Match not found');
  return rows[0];
}

export async function setMatchPublished(id, published) {
  const { rows } = await pool.query(
    `UPDATE matches SET published = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, published],
  );
  if (rows.length === 0) throw notFound('Match not found');
  return rows[0];
}

export async function insertDemoMatch() {
  const { rows } = await pool.query(
    `INSERT INTO matches (
      external_api_id, home_team, away_team, league, league_id, market,
      match_datetime, published, home_position, away_position
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (external_api_id) DO UPDATE SET updated_at = NOW()
    RETURNING *`,
    [
      999001,
      'Demo Home FC',
      'Demo Away United',
      'Premier League',
      39,
      'England',
      new Date().toISOString(),
      true,
      3,
      7,
    ],
  );
  const match = rows[0];
  await pool.query(
    `INSERT INTO live_scores (match_id, home_score, away_score, match_status)
     VALUES ($1, 0, 0, 'NS')
     ON CONFLICT (match_id) DO NOTHING`,
    [match.id],
  );
  return match;
}
