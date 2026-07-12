import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv, assertEnv } from '../lib/env.ts';

// Snapshot/restore the env vars these tests mutate.
const KEYS = [
  'NODE_ENV', 'DATABASE_URL', 'DIRECT_URL', 'AUTH_SECRET', 'NEXT_PUBLIC_SITE_URL',
  'JOBS_WORKER_TOKEN', 'SECRET_ENCRYPTION_KEY', 'ADMIN_API_TOKEN',
];
function snapshot() { const s = {}; for (const k of KEYS) s[k] = process.env[k]; return s; }
function restore(s) { for (const k of KEYS) { if (s[k] === undefined) delete process.env[k]; else process.env[k] = s[k]; } }
function clearAll() { for (const k of KEYS) delete process.env[k]; }

test('production with all required vars present → ok, but warns on missing optionals', () => {
  const s = snapshot();
  try {
    clearAll();
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://x';
    process.env.DIRECT_URL = 'postgres://x';
    process.env.AUTH_SECRET = 'secret';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    const r = validateEnv();
    assert.equal(r.ok, true);
    assert.deepEqual(r.missing, []);
    // The three fail-closed optionals are unset → each should warn.
    assert.ok(r.warnings.some((w) => w.includes('JOBS_WORKER_TOKEN')));
    assert.ok(r.warnings.some((w) => w.includes('SECRET_ENCRYPTION_KEY')));
    assert.ok(r.warnings.some((w) => w.includes('ADMIN_API_TOKEN')));
  } finally { restore(s); }
});

test('production with missing required vars → not ok, lists them, assertEnv throws', () => {
  const s = snapshot();
  try {
    clearAll();
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = 'secret'; // provide one, omit the other three
    const r = validateEnv();
    assert.equal(r.ok, false);
    assert.ok(r.missing.includes('DATABASE_URL'));
    assert.ok(r.missing.includes('DIRECT_URL'));
    assert.ok(r.missing.includes('NEXT_PUBLIC_SITE_URL'));
    assert.ok(!r.missing.includes('AUTH_SECRET'));
    assert.throws(() => assertEnv(), /Missing required environment variables/);
  } finally { restore(s); }
});

test('development never blocks (ok even with nothing set)', () => {
  const s = snapshot();
  try {
    clearAll();
    process.env.NODE_ENV = 'development';
    const r = validateEnv();
    assert.equal(r.ok, true);
    assert.deepEqual(r.missing, []);
    assert.doesNotThrow(() => assertEnv());
  } finally { restore(s); }
});
