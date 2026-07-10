import { prisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';

/**
 * New-user provisioning — the single place that gives a user their initial tenant.
 *
 * Called from BOTH sign-up paths so every account (Credentials or OAuth) is
 * consistently set up:
 *   - Credentials: the register route calls this right after creating the user.
 *   - OAuth: `events.createUser` in lib/auth/config-events calls this.
 *
 * Creates a personal Organization → default Workspace (+ WorkspaceSettings) and an
 * OWNER Membership. Projects and Websites start empty (created later by the user).
 * Idempotent: if the user already owns a membership, it is a no-op.
 */

function personalOrgName(nameOrEmail: string): string {
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0]! : nameOrEmail;
  const trimmed = base.trim();
  return trimmed.length > 0 ? `${trimmed}'s Organization` : 'My Organization';
}

/** Append a short random suffix to keep globally-unique slugs collision-safe. */
function uniqueSlug(base: string): string {
  const root = slugify(base) || 'org';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${root}-${suffix}`;
}

export async function provisionNewUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, memberships: { select: { id: true } } },
  });
  if (!user) return;
  if (user.memberships.length > 0) return; // already provisioned

  const displayName = user.name ?? user.email ?? 'My';

  await prisma.organization.create({
    data: {
      name: personalOrgName(displayName),
      slug: uniqueSlug(displayName),
      memberships: {
        create: { userId: user.id, role: 'OWNER' },
      },
      workspaces: {
        create: {
          name: 'Default Workspace',
          slug: 'default',
          settings: { create: {} },
        },
      },
    },
  });
}
