import { AppError } from '../utils/errors.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  console.error('[error]', err);
  return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
