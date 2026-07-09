import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, __resetRateLimiter } from '../lib/api/rate-limit.ts';

const cfg = { limit: 2, windowMs: 1000 };

test('allows requests up to the limit, then blocks', () => {
  __resetRateLimiter();
  const a = rateLimit('k1', cfg, 1000);
  assert.equal(a.ok, true);
  assert.equal(a.remaining, 1);

  const b = rateLimit('k1', cfg, 1000);
  assert.equal(b.ok, true);
  assert.equal(b.remaining, 0);

  const c = rateLimit('k1', cfg, 1000);
  assert.equal(c.ok, false);
  assert.ok(c.retryAfterSec >= 1);
});

test('sliding window frees up after the window elapses', () => {
  __resetRateLimiter();
  rateLimit('k2', cfg, 1000);
  rateLimit('k2', cfg, 1000);
  assert.equal(rateLimit('k2', cfg, 1500).ok, false); // still inside window
  assert.equal(rateLimit('k2', cfg, 2001).ok, true); // first hit aged out
});

test('separate keys have independent budgets', () => {
  __resetRateLimiter();
  rateLimit('a', cfg, 1000);
  rateLimit('a', cfg, 1000);
  assert.equal(rateLimit('a', cfg, 1000).ok, false);
  assert.equal(rateLimit('b', cfg, 1000).ok, true);
});
