import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import type { Role } from '@/lib/auth/permissions/roles';

/**
 * Loads the dashboard's tenant context for the current session: the user, the
 * organizations they belong to (with role), the current org/workspace selection
 * (from cookies, defaulting to the first), and the current org's workspaces.
 *
 * Read-of-own-tenants only — every query is scoped by the user's memberships, so
 * there is no cross-tenant exposure. This does not replace the tenant-access guard
 * (`lib/auth/access`), which governs access to *specific* resources.
 */

export const ORG_COOKIE = 'dash_org';
export const WORKSPACE_COOKIE = 'dash_ws';

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role: Role;
}
export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}
export interface DashboardContext {
  user: { id: string; name: string | null; email: string | null };
  organizations: OrgSummary[];
  currentOrg: OrgSummary | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
}

export async function loadDashboardContext(): Promise<DashboardContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { role: true, organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { organization: { name: 'asc' } },
  });
  const organizations: OrgSummary[] = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  const base = {
    user: { id: user.id, name: user.name ?? null, email: user.email ?? null },
    organizations,
  };
  if (organizations.length === 0) {
    return { ...base, currentOrg: null, workspaces: [], currentWorkspace: null };
  }

  const jar = await cookies();
  const cookieOrgId = jar.get(ORG_COOKIE)?.value;
  const currentOrg =
    organizations.find((o) => o.id === cookieOrgId) ?? organizations[0]!;

  const workspaces: WorkspaceSummary[] = await prisma.workspace.findMany({
    where: { organizationId: currentOrg.id },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
  const cookieWsId = jar.get(WORKSPACE_COOKIE)?.value;
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWsId) ?? workspaces[0] ?? null;

  return { ...base, currentOrg, workspaces, currentWorkspace };
}
