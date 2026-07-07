import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFetchError, parseApiErrorBody } from '../src/lib/api-errors.ts';

test('parseApiErrorBody reads string error field', () => {
  assert.equal(parseApiErrorBody({ error: 'User not found' }), 'User not found');
});

test('parseApiErrorBody reads nested message field', () => {
  assert.equal(parseApiErrorBody({ error: { message: 'Invalid token' } }), 'Invalid token');
});

test('parseApiErrorBody falls back when shape is unknown', () => {
  assert.equal(parseApiErrorBody({}, 'Fallback'), 'Fallback');
});

test('formatFetchError maps network failures to friendly message', () => {
  const err = new TypeError('Failed to fetch');
  assert.match(formatFetchError(err), /Unable to reach the API/i);
});
