import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const ALLOWED_ROLES = new Set(['free', 'premium', 'admin']);

export function resolveSocketAuth(handshakeAuth = {}) {
  const token = handshakeAuth.token;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      if (payload.role === 'admin') {
        return { role: 'admin', userId: payload.sub, email: payload.email, isPremium: true };
      }
    } catch {
      // fall through to role-based auth
    }
  }

  const role = handshakeAuth.role ?? 'free';
  if (!ALLOWED_ROLES.has(role)) {
    return { role: 'free', isPremium: false };
  }

  return {
    role,
    isPremium: role === 'premium' || role === 'admin',
    email: handshakeAuth.email ?? null,
  };
}
