import { NextResponse } from 'next/server';
import {
  isAccessError,
  statusForCode,
  publicMessageForCode,
} from '@/lib/auth/access/errors';

/**
 * Central mapping of {@link AccessError} → HTTP response. Route handlers wrap access
 * calls and pass thrown errors here; a non-AccessError returns `null` so the caller
 * falls through to `serverError` (lib/api/security.ts). Responses use the same
 * `{ error }` shape as the rest of the API and never leak tenant existence.
 *
 * Usage:
 *   try { const ctx = await requireWebsiteAccess(id, 'website:update'); ... }
 *   catch (err) { return accessErrorResponse(err) ?? serverError('route', err); }
 */
export function accessErrorResponse(err: unknown): NextResponse | null {
  if (!isAccessError(err)) return null;
  return NextResponse.json(
    { error: publicMessageForCode(err.code) },
    { status: statusForCode(err.code) },
  );
}
