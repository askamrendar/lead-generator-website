import { AccessError, type AccessErrorCode } from './errors.ts';
import type { Role } from '@/lib/auth/permissions/roles';
// Relative `.ts` value import (not the `@/` alias) so the Node type-stripping test
// runner can resolve it — the alias is unknown to Node, and this is a value import.
import { can, permissionsFor, type Permission } from '../permissions/rbac.ts';
import type { AccessContext, ResourceChain } from './context';

/**
 * Pure authorization engine — the decision core, free of Prisma/Auth.js/next so it is
 * exhaustively unit-testable (tests/auth-access-engine.test.mjs) and Edge-safe. The
 * resolver (Node) loads data, then delegates every decision here. No other module
 * decides access.
 *
 * Note: value imports of `errors`/`rbac` use explicit `.ts` extensions so the Node
 * type-stripping test runner (no extensionless resolution) can load this in isolation.
 */

/** Reject an unauthenticated caller (fail-closed). */
export function assertAuthenticated(
  userId: string | null | undefined,
): asserts userId is string {
  if (!userId) throw new AccessError('UNAUTHENTICATED');
}

/** Reject a missing resource with a specific invalid-id code (fail-closed). */
export function assertFound<T>(value: T | null | undefined, code: AccessErrorCode): T {
  if (value === null || value === undefined) throw new AccessError(code);
  return value;
}

/**
 * A user's effective role for a tenant, or `null` when they are not a member.
 * Non-membership is surfaced as `NOT_FOUND` (tenant-hidden) — never `FORBIDDEN` —
 * so cross-tenant existence cannot be probed.
 */
export function resolveEffectiveRole(role: Role | null | undefined): Role {
  if (!role) throw new AccessError('NOT_FOUND');
  return role;
}

/** Enforce that `role` grants `permission`, else FORBIDDEN. */
export function authorize(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new AccessError('FORBIDDEN');
}

/** All permissions a role holds (delegates to the RBAC matrix — single source). */
export function permissionsForRole(role: Role): Permission[] {
  return permissionsFor(role);
}

/**
 * The one place a scoped {@link AccessContext} is built. Order enforces least
 * privilege and fail-closed: authenticate → confirm membership (tenant-hidden) →
 * authorize permission → assemble context.
 */
export function buildAccessContext(params: {
  userId: string | null | undefined;
  chain: ResourceChain;
  role: Role | null | undefined;
  permission: Permission;
}): AccessContext {
  const { userId, chain, role, permission } = params;

  assertAuthenticated(userId);
  const effectiveRole = resolveEffectiveRole(role);
  authorize(effectiveRole, permission);

  return {
    userId,
    organization: { id: chain.organizationId },
    ...(chain.workspaceId ? { workspace: { id: chain.workspaceId } } : {}),
    ...(chain.projectId ? { project: { id: chain.projectId } } : {}),
    ...(chain.websiteId ? { website: { id: chain.websiteId } } : {}),
    role: effectiveRole,
    permissions: permissionsForRole(effectiveRole),
    can: (p: Permission) => can(effectiveRole, p),
  };
}

// ---------------------------------------------------------------------------
// Scoped query fragments — the ONLY sanctioned way to build tenant `where`
// clauses. Child queries filter by these instead of hand-written conditions,
// so a scope can never be forgotten or mis-typed.
// ---------------------------------------------------------------------------

export function organizationScope(ctx: AccessContext): { organizationId: string } {
  return { organizationId: ctx.organization.id };
}

export function workspaceScope(ctx: AccessContext): { workspaceId: string } {
  if (!ctx.workspace) throw new Error('workspaceScope: context has no workspace');
  return { workspaceId: ctx.workspace.id };
}

export function projectScope(ctx: AccessContext): { projectId: string } {
  if (!ctx.project) throw new Error('projectScope: context has no project');
  return { projectId: ctx.project.id };
}

export function websiteScope(ctx: AccessContext): { websiteId: string } {
  if (!ctx.website) throw new Error('websiteScope: context has no website');
  return { websiteId: ctx.website.id };
}

/**
 * The tightest tenant filter the context supports (website → project → workspace →
 * organization). Use for "list children of the current resource" queries.
 */
export function tenantScope(
  ctx: AccessContext,
):
  | { websiteId: string }
  | { projectId: string }
  | { workspaceId: string }
  | { organizationId: string } {
  if (ctx.website) return { websiteId: ctx.website.id };
  if (ctx.project) return { projectId: ctx.project.id };
  if (ctx.workspace) return { workspaceId: ctx.workspace.id };
  return { organizationId: ctx.organization.id };
}
