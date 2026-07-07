import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { unauthorized } from '../utils/errors.js';

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid authorization header'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.role !== 'admin') {
      return next(unauthorized('Admin access required'));
    }
    req.admin = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}
