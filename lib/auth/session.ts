import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { type Role } from '@/lib/auth/permissions/roles';

/**
 * Server-side session + membership primitives (Node runtime).
 *
 * The JWT stays lean (just the user id); memberships/roles are resolved here at the
 * point of use, so middleware stays Edge-safe and tokens never go stale on a role
 * change. These are low-level building blocks — resource authorization goes through
 * the single tenant-access layer in `lib/auth/access` (which composes these), not
 * bespoke checks. See [[access-layer]].
 */

export type SessionUser = { id: string; name?: string | null; email?: string | null };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ? (session.user as SessionUser) : null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}

/** The user's role within an organization, or null if they are not a member. */
export async function getOrgRole(
  userId: string,
  organizationId: string,
): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

/** Every organization the current user belongs to, with their role. */
export async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    select: {
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
}

// Resource authorization (require*Access, permission checks, tenant scoping) lives
// in `lib/auth/access` — the single centralized layer. Do not add ad-hoc permission
// checks here; register new resources in access/resolver.ts instead.
