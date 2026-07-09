import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import {
  clientId,
  rateLimit,
  type RateLimitConfig,
} from '@/lib/api/rate-limit';

/**
 * API security helpers: admin-token authorization + rate-limit enforcement,
 * returning ready-to-send `NextResponse` errors (or `null` when the request may
 * proceed). Runtime: `nodejs` (uses `node:crypto`).
 */

export const ADMIN_TOKEN_ENV = 'ADMIN_API_TOKEN';

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function extractToken(request: Request): string | undefined {
  const auth =
    request.headers.get('authorization') ??
    request.headers.get('Authorization');
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1]!.trim();
  }
  return request.headers.get('x-admin-token')?.trim() || undefined;
}

/**
 * Gate an admin-only endpoint.
 *
 * Fails **closed**: if `ADMIN_API_TOKEN` is not configured the endpoint is
 * disabled (503) rather than left open. Returns `null` when authorized.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const expected = process.env[ADMIN_TOKEN_ENV]?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          'Admin API disabled. Set ADMIN_API_TOKEN to enable this endpoint.',
      },
      { status: 503 },
    );
  }
  const provided = extractToken(request);
  if (!provided) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
    );
  }
  if (!constantTimeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * Convert an unexpected thrown error into a consistent 500 response.
 *
 * Routes guard `request.json()` and validation explicitly; this handles the
 * *core* logic (provider calls, cache I/O, versioning) so an unforeseen throw
 * returns the same `{ error }` shape as every other failure — logged
 * server-side, never leaking the message or stack to the caller.
 */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`[api] ${context} failed`, err);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}

/**
 * Enforce a rate limit for a request. Returns a 429 `NextResponse` (with
 * `Retry-After` + `X-RateLimit-*` headers) when exceeded, else `null`.
 */
export function enforceRateLimit(
  request: Request,
  bucket: string,
  cfg: RateLimitConfig,
): NextResponse | null {
  const key = `${bucket}:${clientId(request)}`;
  const result = rateLimit(key, cfg);
  if (result.ok) return null;

  return NextResponse.json(
    { error: 'Too many requests', retryAfter: result.retryAfterSec },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetSec),
      },
    },
  );
}
