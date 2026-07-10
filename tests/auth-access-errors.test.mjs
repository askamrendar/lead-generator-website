import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AccessError,
  isAccessError,
  statusForCode,
  publicMessageForCode,
  ACCESS_ERROR_CODES,
} from '../lib/auth/access/errors.ts';

test('AccessError carries its code and is identifiable', () => {
  const err = new AccessError('FORBIDDEN');
  assert.equal(err.code, 'FORBIDDEN');
  assert.equal(err.name, 'AccessError');
  assert.ok(err instanceof Error);
  assert.equal(isAccessError(err), true);
  assert.equal(isAccessError(new Error('x')), false);
});

test('status mapping is fail-closed and tenant-safe', () => {
  assert.equal(statusForCode('UNAUTHENTICATED'), 401);
  assert.equal(statusForCode('FORBIDDEN'), 403);
  // NOT_FOUND + every INVALID_* collapse to 404 so existence never leaks.
  assert.equal(statusForCode('NOT_FOUND'), 404);
  assert.equal(statusForCode('INVALID_TENANT'), 404);
  assert.equal(statusForCode('INVALID_WORKSPACE'), 404);
  assert.equal(statusForCode('INVALID_PROJECT'), 404);
  assert.equal(statusForCode('INVALID_WEBSITE'), 404);
});

test('every code maps to a valid HTTP status', () => {
  for (const code of ACCESS_ERROR_CODES) {
    const status = statusForCode(code);
    assert.ok(status >= 400 && status < 500, `${code} → ${status}`);
  }
});

test('public messages never distinguish invalid-id from cross-tenant', () => {
  const notFoundish = [
    'NOT_FOUND',
    'INVALID_TENANT',
    'INVALID_WORKSPACE',
    'INVALID_PROJECT',
    'INVALID_WEBSITE',
  ];
  const messages = new Set(notFoundish.map(publicMessageForCode));
  assert.equal(messages.size, 1); // all identical → no leak
  assert.equal(publicMessageForCode('UNAUTHENTICATED'), 'Authentication required');
  assert.equal(publicMessageForCode('FORBIDDEN'), 'Forbidden');
});
