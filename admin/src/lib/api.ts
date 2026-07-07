import { formatFetchError, parseApiErrorBody } from './api-errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export { parseApiErrorBody, formatFetchError } from './api-errors';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_email');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error(formatFetchError(err));
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiErrorBody(err, res.statusText));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function downloadCsv(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
