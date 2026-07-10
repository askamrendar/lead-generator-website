import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { AcceptInvitationForm } from '@/components/auth/AcceptInvitationForm';
import { hashToken, isExpired } from '@/lib/auth/tokens';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = { title: 'Accept invitation' };

/**
 * Team-invitation acceptance. Best-effort server lookup shows the organization name
 * when the invite is valid; the accept API (POST) re-validates authoritatively. Note:
 * invitation *creation/sending* ships with Team Collaboration (Phase 9).
 */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let orgName: string | null = null;
  let invalid = false;
  try {
    const invite = await prisma.teamInvitation.findUnique({
      where: { token: hashToken(token) },
      select: { status: true, expires: true, organization: { select: { name: true } } },
    });
    if (!invite || invite.status !== 'PENDING' || isExpired(invite.expires)) {
      invalid = true;
    } else {
      orgName = invite.organization.name;
    }
  } catch {
    // DB unavailable — fall through to the generic accept view; the API validates.
    invalid = false;
  }

  if (invalid) {
    return (
      <AuthCard title="Invitation unavailable">
        <p className="text-sm text-muted-fg">
          This invitation is invalid, has expired, or has already been used. Ask the
          organization owner to send a new one.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="You're invited"
      description={
        orgName
          ? `Join ${orgName} on the platform.`
          : 'Accept your invitation to join the organization.'
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-fg">
          Sign in (or create an account with the invited email) to accept.
        </p>
        <AcceptInvitationForm token={token} />
      </div>
    </AuthCard>
  );
}
