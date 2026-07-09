import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCacheEntryFresh } from '../lib/ai/cache/freshness.ts';

const base = {
  key: 'k',
  agentId: 'page:home',
  pageType: 'home',
  path: '/',
  promptVersion: '1.0.0',
  provider: 'openai',
  model: 'gpt',
  createdAt: new Date(0).toISOString(),
  content: {},
  status: 'published',
  businessVersion: 'abc',
};

const criteria = { promptVersion: '1.0.0', businessVersion: 'abc', now: 1_000 };

test('fresh entry is usable', () => {
  assert.equal(isCacheEntryFresh(base, criteria), true);
});

test('prompt-version bump invalidates', () => {
  assert.equal(
    isCacheEntryFresh({ ...base, promptVersion: '0.9.0' }, criteria),
    false,
  );
});

test('archived and draft statuses are not served', () => {
  assert.equal(isCacheEntryFresh({ ...base, status: 'archived' }, criteria), false);
  assert.equal(isCacheEntryFresh({ ...base, status: 'draft' }, criteria), false);
});

test('business-config change invalidates', () => {
  assert.equal(
    isCacheEntryFresh({ ...base, businessVersion: 'stale' }, criteria),
    false,
  );
});

test('TTL is enforced only when set, using the provided clock', () => {
  const withTtl = { ...base, createdAt: new Date(0).toISOString(), ttlSeconds: 10 };
  // now = 5s → still fresh; now = 20s → expired.
  assert.equal(isCacheEntryFresh(withTtl, { ...criteria, now: 5_000 }), true);
  assert.equal(isCacheEntryFresh(withTtl, { ...criteria, now: 20_000 }), false);
  // No TTL → never expires on age.
  assert.equal(isCacheEntryFresh(base, { ...criteria, now: 10 ** 12 }), true);
});
