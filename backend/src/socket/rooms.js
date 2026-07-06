export const ROOM = {
  liveAll: 'live:all',
  match: (matchId) => `match:${matchId}`,
  league: (leagueId) => `league:${leagueId}`,
  premiumOdds: (matchId) => `odds:premium:${matchId}`,
};

export function parseMatchRoom(room) {
  const match = room.match(/^match:(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function parseLeagueRoom(room) {
  const match = room.match(/^league:(\d+)$/);
  return match ? Number(match[1]) : null;
}
