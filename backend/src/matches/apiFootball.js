import config from '../config/index.js';
import { AppError } from '../utils/errors.js';

let requestCount = 0;
let lastRequestAt = 0;

async function throttle() {
  const now = Date.now();
  if (now - lastRequestAt < 200) {
    await new Promise((r) => setTimeout(r, 200 - (now - lastRequestAt)));
  }
  lastRequestAt = Date.now();
  requestCount += 1;
}

export function getApiUsage() {
  return { requestCount, lastRequestAt: lastRequestAt || null };
}

export async function apiFootballFetch(path, params = {}) {
  if (!config.apiFootballKey) {
    throw new AppError(503, 'API-Football key not configured');
  }

  await throttle();

  const url = new URL(path, config.apiFootballBaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': config.apiFootballKey,
    },
  });

  if (!response.ok) {
    throw new AppError(502, `API-Football error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    const message = Object.values(data.errors).join('; ');
    throw new AppError(502, `API-Football: ${message}`);
  }

  return data;
}

export async function fetchLiveFixtures() {
  const data = await apiFootballFetch('/fixtures', { live: 'all' });
  return data.response ?? [];
}

export async function fetchStandings(leagueId, season = new Date().getFullYear()) {
  const data = await apiFootballFetch('/standings', { league: leagueId, season });
  return data.response ?? [];
}

export async function fetchFixtures({ date, league, season = new Date().getFullYear() }) {
  const params = { timezone: 'UTC' };
  if (date) params.date = date;
  if (league) params.league = league;
  if (season) params.season = season;

  const data = await apiFootballFetch('/fixtures', params);
  return data.response ?? [];
}

export async function fetchFixtureOdds(fixtureId) {
  const data = await apiFootballFetch('/odds', { fixture: fixtureId });
  return data.response ?? [];
}
