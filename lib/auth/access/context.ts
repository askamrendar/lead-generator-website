import type { Role } from '@/lib/auth/permissions/roles';
import type { Permission } from '@/lib/auth/permissions/rbac';

/**
 * Authorization types shared by the engine (pure) and the resolver (Node). Type-only
 * module — erased at compile time, so it is safe to import from anywhere.
 */

/**
 * The tenant chain for a resource, resolved from its id up to the owning
 * organization. Loaders (resolver.ts) produce this; the engine reasons over it.
 * Only the levels relevant to the resource are populated (an organization request
 * fills just `organizationId`; a website request fills all four).
 */
export interface ResourceChain {
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  websiteId?: string;
}

/**
 * The scoped authorization context returned by every `require*Access` helper. This
 * is the ONLY object downstream code should read for identity, tenant scope, and
 * permissions — never raw database rows. Use the `*Scope` helpers (engine.ts) to
 * derive `where` filters for child queries from this context.
 */
export interface AccessContext {
  userId: string;
  organization: { id: string };
  workspace?: { id: string };
  project?: { id: string };
  website?: { id: string };
  /** Effective role of the user within `organization`. */
  role: Role;
  /** All permissions granted by `role` (expanded for convenience/inspection). */
  permissions: Permission[];
  /** Bound predicate — `ctx.can('website:update')`. */
  can: (permission: Permission) => boolean;
}
