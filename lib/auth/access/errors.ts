/**
 * Authorization error taxonomy — the single vocabulary every tenant-access failure
 * speaks. PURE module (no Prisma/Auth.js/next) so it is unit-testable and reusable
 * from any runtime. `http.ts` maps these to responses; nothing else invents statuses.
 *
 * Tenant-hiding rule: a resource that exists but belongs to another tenant surfaces
 * as `NOT_FOUND` (never `FORBIDDEN`) so existence is not leaked across tenants. All
 * "invalid id" variants and `NOT_FOUND` map to HTTP 404 externally, while remaining
 * distinct internally for logging.
 */

export const ACCESS_ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_TENANT',
  'INVALID_WORKSPACE',
  'INVALID_PROJECT',
  'INVALID_WEBSITE',
] as const;

export type AccessErrorCode = (typeof ACCESS_ERROR_CODES)[number];

export class AccessError extends Error {
  readonly code: AccessErrorCode;

  constructor(code: AccessErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AccessError';
    this.code = code;
    // Preserve prototype chain when compiled down to ES5-ish targets.
    Object.setPrototypeOf(this, AccessError.prototype);
  }
}

export function isAccessError(err: unknown): err is AccessError {
  return err instanceof AccessError;
}

/** HTTP status for a code. Fail-closed + tenant-safe (everything unknown → 404). */
export function statusForCode(code: AccessErrorCode): number {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    default:
      // NOT_FOUND + all INVALID_* → 404 so cross-tenant existence never leaks.
      return 404;
  }
}

/**
 * Client-safe message for a code — deliberately generic. INVALID_* and NOT_FOUND
 * collapse to the same "Not found" so the caller cannot distinguish "wrong id" from
 * "exists in another tenant".
 */
export function publicMessageForCode(code: AccessErrorCode): string {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'Authentication required';
    case 'FORBIDDEN':
      return 'Forbidden';
    default:
      return 'Not found';
  }
}
