import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backoffSeconds, nextRetry, isTerminal, isDue, nextOccurrence, isStuck } from '../lib/jobs/policy.ts';

test('backoff grows exponentially and caps', () => {
  assert.equal(backoffSeconds(1, 30), 30);
  assert.equal(backoffSeconds(2, 30), 60);
  assert.equal(backoffSeconds(3, 30), 120);
  assert.equal(backoffSeconds(10, 30, 3600), 3600); // capped
});

test('nextRetry stops at maxAttempts', () => {
  const now = 1_000_000;
  const stop = nextRetry(3, 3, now);
  assert.equal(stop.retry, false);
  assert.equal(stop.scheduledAt, null);
});

test('nextRetry schedules future run with backoff', () => {
  const now = 1_000_000;
  const r = nextRetry(1, 3, now, 30);
  assert.equal(r.retry, true);
  assert.equal(r.scheduledAt.getTime(), now + 30_000);
});

test('isTerminal identifies final states', () => {
  assert.equal(isTerminal('SUCCEEDED'), true);
  assert.equal(isTerminal('FAILED'), true);
  assert.equal(isTerminal('CANCELLED'), true);
  assert.equal(isTerminal('QUEUED'), false);
  assert.equal(isTerminal('RUNNING'), false);
});

test('isDue only for queued past-due jobs', () => {
  assert.equal(isDue('QUEUED', 100, 200), true);
  assert.equal(isDue('QUEUED', 300, 200), false);
  assert.equal(isDue('RUNNING', 100, 200), false);
});

test('scheduler nextOccurrence adds interval', () => {
  assert.equal(nextOccurrence(1_000_000, 3600).getTime(), 1_000_000 + 3_600_000);
});

test('isStuck flags RUNNING jobs past the visibility timeout', () => {
  const now = 1_000_000;
  // RUNNING and started long ago → stuck.
  assert.equal(isStuck('RUNNING', now - 400_000, now, 300), true);
  // RUNNING but started recently → not stuck.
  assert.equal(isStuck('RUNNING', now - 10_000, now, 300), false);
  // RUNNING with no startedAt → treated as stuck (can't linger forever).
  assert.equal(isStuck('RUNNING', null, now, 300), true);
  // Non-RUNNING states are never stuck.
  assert.equal(isStuck('QUEUED', now - 400_000, now, 300), false);
  assert.equal(isStuck('SUCCEEDED', null, now, 300), false);
});
