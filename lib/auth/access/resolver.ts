import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { AccessError, type AccessErrorCode } from '@/lib/auth/access/errors';
import { buildAccessContext } from '@/lib/auth/access/engine';
import type { AccessContext, ResourceChain } from '@/lib/auth/access/context';
import type { Role } from '@/lib/auth/permissions/roles';
import type { Permission } from '@/lib/auth/permissions/rbac';

/**
 * Tenant-access resolver (Node runtime) — binds the pure engine to real session +
 * Prisma data. This is the ONLY supported entry point for reading a tenant resource:
 * every route/server action calls a `require*Access` helper, gets a scoped
 * {@link AccessContext}, and derives further queries from it (never hand-rolled
 * tenant `where` clauses).
 *
 * Extensibility: a new resource needs only (1) a `ChainLoader` that resolves its id
 * to a {@link ResourceChain}, and (2) an invalid-id code — then one line registering
 * it below via `defineResourceAccess`. The engine and every existing helper are
 * untouched. Callers supply the required {@link Permission} at the call site, so
 * permission mapping lives with the operation, not here.
 */

/** Resolve a resource id to its tenant chain, or `null` if it does not exist. */
type ChainLoader = (id: string) => Promise<ResourceChain | null>;

interface ResourceDescriptor {
  /** Loads the tenant chain for the resource id. */
  load: ChainLoader;
  /** Error code when the id resolves to nothing (fail-closed). */
  notFound: AccessErrorCode;
}

/** The user's role in an organization, or `null` when they are not a member. */
async function loadOrgRole(userId: string, organizationId: string): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

// ── Chain loaders (one focused query each, selecting only the id spine) ──────────

const loadOrganizationChain: ChainLoader = async (id) => {
  const org = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
  return org ? { organizationId: org.id } : null;
};

const loadWorkspaceChain: ChainLoader = async (id) => {
  const ws = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, organizationId: true },
  });
  return ws ? { organizationId: ws.organizationId, workspaceId: ws.id } : null;
};

const loadProjectChain: ChainLoader = async (id) => {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, workspace: { select: { organizationId: true } } },
  });
  return project
    ? {
        organizationId: project.workspace.organizationId,
        workspaceId: project.workspaceId,
        projectId: project.id,
      }
    : null;
};

const loadWebsiteChain: ChainLoader = async (id) => {
  const website = await prisma.website.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      project: {
        select: { workspaceId: true, workspace: { select: { organizationId: true } } },
      },
    },
  });
  return website
    ? {
        organizationId: website.project.workspace.organizationId,
        workspaceId: website.project.workspaceId,
        projectId: website.projectId,
        websiteId: website.id,
      }
    : null;
};

/**
 * Build a `require<Resource>Access(id, permission)` helper from a descriptor.
 * The returned function: authenticate → load chain (or throw invalid-id) → resolve
 * effective role → authorize → scoped context. Reused for every resource kind.
 */
export function defineResourceAccess(descriptor: ResourceDescriptor) {
  return async (id: string, permission: Permission): Promise<AccessContext> => {
    const user = await getCurrentUser();
    if (!user) throw new AccessError('UNAUTHENTICATED');

    const chain = await descriptor.load(id);
    if (!chain) throw new AccessError(descriptor.notFound);

    const role = await loadOrgRole(user.id, chain.organizationId);
    return buildAccessContext({ userId: user.id, chain, role, permission });
  };
}

/**
 * Resource registry. Add future resources here (e.g. deployment/domain/billing/
 * apiKey) with a loader + invalid-id code — no other code changes required.
 */
export const requireOrganizationAccess = defineResourceAccess({
  load: loadOrganizationChain,
  notFound: 'INVALID_TENANT',
});
export const requireWorkspaceAccess = defineResourceAccess({
  load: loadWorkspaceChain,
  notFound: 'INVALID_WORKSPACE',
});
export const requireProjectAccess = defineResourceAccess({
  load: loadProjectChain,
  notFound: 'INVALID_PROJECT',
});
export const requireWebsiteAccess = defineResourceAccess({
  load: loadWebsiteChain,
  notFound: 'INVALID_WEBSITE',
});
