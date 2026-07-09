import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSiteUrl,
  isLocalhostUrl,
  assertProductionSiteUrl,
} from '../lib/site.ts';

test('isLocalhostUrl detects loopback origins', () => {
  assert.equal(isLocalhostUrl('http://localhost:3000'), true);
  assert.equal(isLocalhostUrl('http://127.0.0.1'), true);
  assert.equal(isLocalhostUrl('http://0.0.0.0:8080'), true);
  assert.equal(isLocalhostUrl('https://apexplumbing.com'), false);
});

test('resolveSiteUrl trims a trailing slash and falls back to localhost', () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
    assert.equal(resolveSiteUrl(), 'https://example.com');
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(resolveSiteUrl(), 'http://localhost:3000');
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  }
});

test('assertProductionSiteUrl: strict mode throws on a localhost production origin', () => {
  const prevNode = process.env.NODE_ENV;
  const prevOptOut = process.env.ALLOW_LOCALHOST_BUILD;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_LOCALHOST_BUILD;
    assert.throws(() =>
      assertProductionSiteUrl('http://localhost:3000', { strict: true }),
    );
    // A real https origin is fine even in strict production.
    assert.equal(
      assertProductionSiteUrl('https://apexplumbing.com', { strict: true }),
      false,
    );
    // The opt-out silences the guard.
    process.env.ALLOW_LOCALHOST_BUILD = '1';
    assert.equal(assertProductionSiteUrl('http://localhost:3000'), false);
  } finally {
    if (prevNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNode;
    if (prevOptOut === undefined) delete process.env.ALLOW_LOCALHOST_BUILD;
    else process.env.ALLOW_LOCALHOST_BUILD = prevOptOut;
  }
});

test('assertProductionSiteUrl: never flags outside production', () => {
  const prev = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    assert.equal(
      assertProductionSiteUrl('http://localhost:3000', { strict: true }),
      false,
    );
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }
});
