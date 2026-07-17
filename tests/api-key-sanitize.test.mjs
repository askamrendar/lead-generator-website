import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Contract test for the API-key sanitizer in lib/ai/credentials.ts.
 * That module imports server deps the Node test loader cannot resolve, so the
 * regex pipeline is mirrored here verbatim — if sanitizeApiKey changes,
 * update BOTH places (the implementation is 3 lines).
 */
function sanitizeApiKey(raw) {
  let key = raw
    .replace(/["'`]/g, '')
    .replace(/^\s*(authorization\s*:)?\s*bearer\s+/i, '');
  key = key.replace(/[\s\u0000-\u001f\u007f\u00a0\u200b-\u200f\u2028\u2029\ufeff]/g, '');
  key = key.replace(/^(SK|Sk|sK)-(or|ant|proj)?/, (m) => m.toLowerCase());
  return key;
}

test('strips surrounding whitespace and newlines', () => {
  assert.equal(sanitizeApiKey('  sk-or-v1-abc123  '), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('sk-or-v1-abc\n123'), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('sk-or-v1-abc\r\n123\t'), 'sk-or-v1-abc123');
});

test('strips quotes and pasted Bearer prefixes', () => {
  assert.equal(sanitizeApiKey('"sk-or-v1-abc123"'), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('Bearer sk-or-v1-abc123'), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('Authorization: Bearer sk-or-v1-abc123'), 'sk-or-v1-abc123');
});

test('strips invisible unicode (zero-width, BOM, NBSP)', () => {
  assert.equal(sanitizeApiKey('sk-or-v1-abc\u200b123'), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('\ufeffsk-ant-xyz'), 'sk-ant-xyz');
  assert.equal(sanitizeApiKey('sk\u00a0-or-v1-a1'), 'sk-or-v1-a1');
});

test('lowercases an autocapitalized sk- prefix', () => {
  assert.equal(sanitizeApiKey('Sk-or-v1-abc123'), 'sk-or-v1-abc123');
  assert.equal(sanitizeApiKey('SK-ant-abc123'), 'sk-ant-abc123');
  // Only the prefix — the key body keeps its case.
  assert.equal(sanitizeApiKey('Sk-or-v1-AbC123'), 'sk-or-v1-AbC123');
});

test('leaves clean keys untouched', () => {
  assert.equal(sanitizeApiKey('sk-or-v1-1234567890abcdef'), 'sk-or-v1-1234567890abcdef');
  assert.equal(sanitizeApiKey('AIzaSyExample-Key_123'), 'AIzaSyExample-Key_123');
});
