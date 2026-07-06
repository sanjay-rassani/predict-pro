import { Server } from 'socket.io';
import config from '../config/index.js';
import { resolveSocketAuth } from './auth.js';
import { ROOM } from './rooms.js';

let io = null;

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    socket.data.auth = resolveSocketAuth(socket.handshake.auth);
    next();
  });

  io.on('connection', (socket) => {
    const { role, isPremium } = socket.data.auth;
    socket.join(ROOM.liveAll);

    socket.on('join:match', (payload, ack) => {
      const matchId = Number(payload?.matchId ?? payload);
      if (!matchId) {
        ack?.({ ok: false, error: 'matchId required' });
        return;
      }
      socket.join(ROOM.match(matchId));
      if (isPremium) {
        socket.join(ROOM.premiumOdds(matchId));
      }
      ack?.({ ok: true, matchId, oddsStream: isPremium });
    });

    socket.on('leave:match', (payload) => {
      const matchId = Number(payload?.matchId ?? payload);
      if (!matchId) return;
      socket.leave(ROOM.match(matchId));
      socket.leave(ROOM.premiumOdds(matchId));
    });

    socket.on('join:league', (payload, ack) => {
      const leagueId = Number(payload?.leagueId ?? payload);
      if (!leagueId) {
        ack?.({ ok: false, error: 'leagueId required' });
        return;
      }
      socket.join(ROOM.league(leagueId));
      ack?.({ ok: true, leagueId });
    });

    socket.emit('connected', { role, isPremium, oddsStream: isPremium });
  });

  console.log('[socket] Socket.IO initialized');
  return io;
}

export function emitLiveScoreUpdate(payload) {
  if (!io) return;
  io.to(ROOM.liveAll).emit('live:score', payload);
  io.to(ROOM.match(payload.matchId)).emit('live:score', payload);
}

export function emitStandingsUpdate(payload) {
  if (!io) return;
  io.to(ROOM.league(payload.leagueId)).emit('live:standings', payload);
}

export function emitLiveOddsUpdate(payload) {
  if (!io) return;
  io.to(ROOM.premiumOdds(payload.matchId)).emit('live:odds', payload);
}
