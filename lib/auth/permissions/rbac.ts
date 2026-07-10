/**
 * RBAC permission matrix — maps an action to the minimum role required.
 *
 * PURE module (no Prisma/Auth.js) so it is unit-testable and Edge-safe. Higher-level
 * code resolves a user's effective role for a tenant (org membership, optionally
 * raised by a team role via `maxRole`) and calls `can()`.
 */

// Explicit `.ts` extension (not the `@/` alias) so this value import resolves both
// under Next/tsc AND under the Node test runner's type-stripping loader, which does
// no extensionless resolution. roles.ts stays the single source of the hierarchy.
import { type Role, hasAtLeast } from './roles.ts';

/** Coarse-grained, resource-oriented permissions for the SaaS foundation. */
export type Permission =
  // Organization
  | 'org:view'
  | 'org:update'
  | 'org:delete'
  | 'org:manage_members'
  | 'org:manage_billing'
  // Team
  | 'team:view'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  | 'team:invite'
  // Workspace
  | 'workspace:view'
  | 'workspace:create'
  | 'workspace:update'
  | 'workspace:delete'
  // Project
  | 'project:view'
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  // Website
  | 'website:view'
  | 'website:create'
  | 'website:update'
  | 'website:delete'
  | 'website:publish';

/** Minimum role required for each permission. */
const REQUIRED: Record<Permission, Role> = {
  'org:view': 'VIEWER',
  'org:update': 'ADMIN',
  'org:delete': 'OWNER',
  'org:manage_members': 'ADMIN',
  'org:manage_billing': 'OWNER',

  'team:view': 'VIEWER',
  'team:create': 'ADMIN',
  'team:update': 'ADMIN',
  'team:delete': 'ADMIN',
  'team:invite': 'ADMIN',

  'workspace:view': 'VIEWER',
  'workspace:create': 'ADMIN',
  'workspace:update': 'MEMBER',
  'workspace:delete': 'ADMIN',

  'project:view': 'VIEWER',
  'project:create': 'MEMBER',
  'project:update': 'MEMBER',
  'project:delete': 'ADMIN',

  'website:view': 'VIEWER',
  'website:create': 'MEMBER',
  'website:update': 'MEMBER',
  'website:delete': 'ADMIN',
  'website:publish': 'ADMIN',
};

/** Every known permission (the keys of the matrix) — the canonical permission set. */
export const PERMISSIONS = Object.keys(REQUIRED) as Permission[];

/** True when `role` satisfies the minimum required for `permission`. */
export function can(role: Role, permission: Permission): boolean {
  return hasAtLeast(role, REQUIRED[permission]);
}

/** The minimum role that grants `permission` (useful for UI hints/tests). */
export function requiredRole(permission: Permission): Role {
  return REQUIRED[permission];
}

/** All permissions granted to `role` (role-expansion; used to build a scoped context). */
export function permissionsFor(role: Role): Permission[] {
  return PERMISSIONS.filter((p) => can(role, p));
}
