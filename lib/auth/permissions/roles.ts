/**
 * Role hierarchy — the single source of truth for role ordering.
 *
 * PURE module: no Prisma, no Auth.js imports, so it is unit-testable in isolation
 * (see tests/auth-rbac.test.mjs) and safe to import from Edge middleware. The
 * string values mirror the Prisma `Role` enum in prisma/schema.prisma.
 */

export const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;

export type Role = (typeof ROLES)[number];

/** Numeric rank — higher means more privileged. */
const RANK: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  VIEWER: 0,
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function rankOf(role: Role): number {
  return RANK[role];
}

/** True when `role` is at least as privileged as `min` (OWNER ≥ ADMIN ≥ MEMBER ≥ VIEWER). */
export function hasAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/** Higher-privileged of the two roles (used when merging org + team roles). */
export function maxRole(a: Role, b: Role): Role {
  return RANK[a] >= RANK[b] ? a : b;
}
