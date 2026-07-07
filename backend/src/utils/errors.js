export class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? statusToCode(statusCode);
    this.name = 'AppError';
  }
}

function statusToCode(statusCode) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
  };
  return map[statusCode] ?? 'APP_ERROR';
}

export function notFound(message = 'Not found') {
  return new AppError(404, message);
}

export function badRequest(message = 'Bad request') {
  return new AppError(400, message);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError(401, message);
}

export function forbidden(message = 'Forbidden') {
  return new AppError(403, message);
}

export function conflict(message = 'Conflict') {
  return new AppError(409, message);
}
