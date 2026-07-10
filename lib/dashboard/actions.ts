'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  requireOrganizationAccess,
  requireWorkspaceAccess,
  isAccessError,
} from '@/lib/auth/access';
import { ORG_COOKIE, WORKSPACE_COOKIE } from '@/lib/dashboard/context';

/**
 * Server actions for the org/workspace switchers. Each validates membership through
 * the tenant-access layer BEFORE persisting the selection cookie, so a user can never
 * pin the dashboard to a tenant they don't belong to. Invalid targets are ignored
 * (the context loader also falls back to the first membership).
 */

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export async function switchOrganization(organizationId: string): Promise<void> {
  try {
    // Membership check via the access layer (throws if not a member).
    await requireOrganizationAccess(organizationId, 'org:view');
  } catch (err) {
    if (isAccessError(err)) return; // ignore invalid selection
    throw err;
  }
  const jar = await cookies();
  jar.set(ORG_COOKIE, organizationId, COOKIE_OPTS);
  // Clear the workspace selection so it re-defaults within the new org.
  jar.delete(WORKSPACE_COOKIE);
  revalidatePath('/dashboard');
}

export async function switchWorkspace(workspaceId: string): Promise<void> {
  try {
    await requireWorkspaceAccess(workspaceId, 'workspace:view');
  } catch (err) {
    if (isAccessError(err)) return;
    throw err;
  }
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, workspaceId, COOKIE_OPTS);
  revalidatePath('/dashboard');
}
