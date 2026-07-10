import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Opaque single-use tokens for email verification and password reset.
 *
 * PURE module (only `node:crypto`) → unit-testable (tests/auth-tokens.test.mjs).
 *
 * Security model: the raw token is sent to the user (in a link) and only its
 * SHA-256 hash is persisted. A leaked database therefore cannot be used to forge
 * verification/reset links. Lookups compare hashes in constant time.
 */

const TOKEN_BYTES = 32;
const HOUR_MS = 60 * 60 * 1000;

export interface IssuedToken {
  /** Raw token — send to the user, never store. */
  token: string;
  /** SHA-256 hash of the token — store this. */
  tokenHash: string;
  /** Absolute expiry. */
  expires: Date;
}

/** SHA-256 hex digest of a raw token (deterministic → safe to store/index). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new token valid for `ttlHours`. `now` is injectable for tests so the
 * function stays pure/deterministic.
 */
export function createToken(ttlHours: number, now: number = Date.now()): IssuedToken {
  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    throw new Error('createToken: ttlHours must be a positive number');
  }
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expires: new Date(now + ttlHours * HOUR_MS),
  };
}

/** Constant-time comparison of a raw token against a stored hash. */
export function tokenMatches(rawToken: string, storedHash: string): boolean {
  if (typeof rawToken !== 'string' || typeof storedHash !== 'string') return false;
  const a = Buffer.from(hashToken(rawToken), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when `expires` is at or before `now`. */
export function isExpired(expires: Date | string | number, now: number = Date.now()): boolean {
  const t = expires instanceof Date ? expires.getTime() : new Date(expires).getTime();
  if (Number.isNaN(t)) return true;
  return t <= now;
}
