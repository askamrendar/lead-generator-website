import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from '../lib/auth/validation.ts';

test('registerSchema accepts a valid payload and normalizes email', () => {
  const r = registerSchema.safeParse({
    name: 'Jane Doe',
    email: '  Jane@Example.COM ',
    password: 'longenough1',
  });
  assert.equal(r.success, true);
  assert.equal(r.data.email, 'jane@example.com'); // trimmed + lowercased
});

test('registerSchema rejects short passwords', () => {
  const r = registerSchema.safeParse({
    name: 'Jane',
    email: 'jane@example.com',
    password: 'short',
  });
  assert.equal(r.success, false);
});

test('registerSchema rejects an invalid email', () => {
  const r = registerSchema.safeParse({
    name: 'Jane',
    email: 'not-an-email',
    password: 'longenough1',
  });
  assert.equal(r.success, false);
});

test('loginSchema requires a non-empty password', () => {
  assert.equal(
    loginSchema.safeParse({ email: 'a@b.com', password: '' }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success,
    true,
  );
});

test('resetPasswordSchema requires a plausible token and strong password', () => {
  assert.equal(
    resetPasswordSchema.safeParse({ token: 'short', password: 'longenough1' })
      .success,
    false,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      token: 'a'.repeat(64),
      password: 'longenough1',
    }).success,
    true,
  );
});
