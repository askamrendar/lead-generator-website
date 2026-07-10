import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createToken,
  hashToken,
  tokenMatches,
  isExpired,
} from '../lib/auth/tokens.ts';

test('createToken returns a raw token, its hash, and a future expiry', () => {
  const now = 1_000_000;
  const issued = createToken(24, now);
  assert.equal(typeof issued.token, 'string');
  assert.ok(issued.token.length >= 32);
  assert.equal(issued.tokenHash, hashToken(issued.token));
  assert.equal(issued.expires.getTime(), now + 24 * 60 * 60 * 1000);
});

test('the raw token is never equal to its stored hash', () => {
  const { token, tokenHash } = createToken(1);
  assert.notEqual(token, tokenHash);
});

test('tokenMatches is true for the right token, false otherwise', () => {
  const { token, tokenHash } = createToken(1);
  assert.equal(tokenMatches(token, tokenHash), true);
  assert.equal(tokenMatches('wrong-token', tokenHash), false);
});

test('isExpired respects the boundary', () => {
  const now = 5_000;
  assert.equal(isExpired(new Date(now - 1), now), true);
  assert.equal(isExpired(new Date(now), now), true); // at-or-before
  assert.equal(isExpired(new Date(now + 1), now), false);
});

test('createToken rejects a non-positive ttl', () => {
  assert.throws(() => createToken(0));
  assert.throws(() => createToken(-3));
});

test('two tokens are unique', () => {
  const a = createToken(1);
  const b = createToken(1);
  assert.notEqual(a.token, b.token);
});
