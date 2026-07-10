import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/auth/password.ts';

test('hash then verify accepts the correct password', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
});

test('verify rejects the wrong password', async () => {
  const hash = await hashPassword('s3cret-password');
  assert.equal(await verifyPassword('not-the-password', hash), false);
});

test('encoded hash has the self-describing scrypt format', async () => {
  const hash = await hashPassword('whatever-123');
  const parts = hash.split('$');
  assert.equal(parts.length, 6);
  assert.equal(parts[0], 'scrypt');
});

test('hashes are salted (same input → different encodings)', async () => {
  const a = await hashPassword('same-input');
  const b = await hashPassword('same-input');
  assert.notEqual(a, b);
  // ...but both still verify.
  assert.equal(await verifyPassword('same-input', a), true);
  assert.equal(await verifyPassword('same-input', b), true);
});

test('verify returns false for malformed encodings instead of throwing', async () => {
  assert.equal(await verifyPassword('x', 'not-a-valid-hash'), false);
  assert.equal(await verifyPassword('x', 'scrypt$16384$8$1$deadbeef'), false);
  assert.equal(await verifyPassword('x', ''), false);
});

test('empty password throws on hash', async () => {
  await assert.rejects(() => hashPassword(''));
});
