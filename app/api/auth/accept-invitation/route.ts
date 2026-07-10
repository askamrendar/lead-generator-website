import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth/session';
import { hashToken, isExpired } from '@/lib/auth/tokens';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

const bodySchema = z.object({ token: z.string().min(16).max(256) });

/**
 * Accept a team invitation. Requires an authenticated session whose email matches
 * the invite. Creates the org membership (and team membership when the invite targets
 * a team), then marks the invite accepted. Idempotent and single-use.
 *
 * Note: invitation creation/sending is delivered with Team Collaboration (Phase 9);
 * this endpoint consumes an existing, hashed-token invite.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'auth', LIMITS.auth());
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 });
  }

  try {
    const invite = await prisma.teamInvitation.findUnique({
      where: { token: hashToken(parsed.data.token) },
    });

    // Generic 400 for any unusable invite (no detail leaked).
    if (!invite || invite.status !== 'PENDING' || isExpired(invite.expires)) {
      return NextResponse.json({ error: 'Invitation invalid or expired' }, { status: 400 });
    }

    // The invite must be for the signed-in user's email.
    const email = user.email?.toLowerCase();
    if (!email || email !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address.' },
        { status: 403 },
      );
    }

    await prisma.$transaction([
      // Org membership (idempotent via the unique userId_organizationId key).
      prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invite.organizationId,
          },
        },
        create: {
          userId: user.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
        update: {},
      }),
      // Optional team membership when the invite targets a specific team.
      ...(invite.teamId
        ? [
            prisma.teamMembership.upsert({
              where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
              create: { userId: user.id, teamId: invite.teamId, role: invite.role },
              update: {},
            }),
          ]
        : []),
      prisma.teamInvitation.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return NextResponse.json({ ok: true, organizationId: invite.organizationId });
  } catch (err) {
    return serverError('auth/accept-invitation', err);
  }
}
