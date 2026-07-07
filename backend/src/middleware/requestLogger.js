import morgan from 'morgan';

export function requestLogger() {
  return morgan(':method :url :status :response-time ms');
}
