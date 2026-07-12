import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveKey,
  encryptWithKey,
  decryptWithKey,
  isEncrypted,
  encryptSecret,
} from '../lib/security/secrets.ts';

test('encrypt → decrypt round-trips with the same key', () => {
  const key = deriveKey('a-test-passphrase');
  const secret = 'sk-live-super-secret-token-12345';
  const token = encryptWithKey(secret, key);
  assert.ok(isEncrypted(token), 'token should carry the enc:v1: prefix');
  assert.notEqual(token, secret, 'ciphertext must differ from plaintext');
  assert.equal(decryptWithKey(token, key), secret);
});

test('same plaintext encrypts to different tokens (random IV)', () => {
  const key = deriveKey('another-passphrase');
  const a = encryptWithKey('same-value', key);
  const b = encryptWithKey('same-value', key);
  assert.notEqual(a, b, 'random IV should make each ciphertext unique');
  assert.equal(decryptWithKey(a, key), 'same-value');
  assert.equal(decryptWithKey(b, key), 'same-value');
});

test('decrypting with the wrong key fails closed (throws)', () => {
  const token = encryptWithKey('secret', deriveKey('right-key'));
  assert.throws(() => decryptWithKey(token, deriveKey('wrong-key')));
});

test('tampered ciphertext is rejected by the auth tag', () => {
  const key = deriveKey('k');
  const token = encryptWithKey('secret', key);
  const parts = token.split(':');
  // Flip a character in the ciphertext segment.
  parts[4] = parts[4].slice(0, -2) + (parts[4].slice(-2) === 'AA' ? 'BB' : 'AA');
  assert.throws(() => decryptWithKey(parts.join(':'), key));
});

test('decryptWithKey passes legacy plaintext through unchanged', () => {
  const key = deriveKey('k');
  assert.equal(decryptWithKey('plain-old-value', key), 'plain-old-value');
});

test('isEncrypted only matches the enc:v1: token format', () => {
  assert.equal(isEncrypted('enc:v1:a:b:c'), true);
  assert.equal(isEncrypted('sk-plaintext'), false);
  assert.equal(isEncrypted(''), false);
});

test('encryptSecret fails closed in production without a key', () => {
  const prevEnv = process.env.NODE_ENV;
  const prevKey = process.env.SECRET_ENCRYPTION_KEY;
  try {
    delete process.env.SECRET_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'production';
    // Storing a real secret with no key in production must throw, not silently store plaintext.
    assert.throws(() => encryptSecret('sk-live-secret'), /SECRET_ENCRYPTION_KEY/);
    // Empty / already-encrypted values are still passthrough (nothing to protect).
    assert.equal(encryptSecret(''), '');
    assert.equal(encryptSecret('enc:v1:a:b:c'), 'enc:v1:a:b:c');
  } finally {
    if (prevEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevEnv;
    if (prevKey === undefined) delete process.env.SECRET_ENCRYPTION_KEY; else process.env.SECRET_ENCRYPTION_KEY = prevKey;
  }
});

test('encryptSecret passes through in development without a key', () => {
  const prevEnv = process.env.NODE_ENV;
  const prevKey = process.env.SECRET_ENCRYPTION_KEY;
  try {
    delete process.env.SECRET_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'development';
    assert.equal(encryptSecret('sk-dev-secret'), 'sk-dev-secret');
  } finally {
    if (prevEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevEnv;
    if (prevKey === undefined) delete process.env.SECRET_ENCRYPTION_KEY; else process.env.SECRET_ENCRYPTION_KEY = prevKey;
  }
});
