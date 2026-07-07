/**
 * Parse consistent API error payloads from the backend.
 */
export function parseApiErrorBody(body: unknown, fallback = 'Request failed'): string {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.error === 'object' && record.error !== null) {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === 'string') return nested.message;
    }
  }
  return fallback;
}

export function formatFetchError(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return 'Unable to reach the API. Is the backend running?';
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
