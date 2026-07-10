import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { enforceRateLimit, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { registerSchema } from '@/lib/auth/validation';
import { hashPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/tokens';
import { prisma } from '@/lib/db/prisma';
import { provisionNewUser } from '@/lib/auth/provisioning';
import { sendVerificationEmail } from '@/lib/auth/email';

export const runtime = 'nodejs';

const VERIFICATION_TTL_HOURS = Number(
  process.env.AUTH_EMAIL_VERIFICATION_TTL_HOURS ?? 24,
);

/**
 * Credentials sign-up. Creates the user, provisions their initial tenant
 * (organization + default workspace), and issues an email-verification token.
 * Rate-limited and validated server-side, reusing the existing API security seam.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'auth', LIMITS.auth());
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { name, email, password } = parsed.data;

  // Enumeration-safe: whether the email is new or already registered, respond with
  // the SAME generic success (identical status + body). The client never learns
  // which emails have accounts; genuine collisions are only logged server-side.
  const genericSuccess = NextResponse.json({
    ok: true,
    message: 'If this email can be registered, a verification link has been sent.',
  });

  try {
    // Always hash first so the timing of the new-account and existing-account paths
    // is comparable (no fast-path that would leak existence via response latency).
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { id: true, email: true },
    });

    // Give the new account its organization + default workspace.
    await provisionNewUser(user.id);

    // Issue a single-use, hashed email-verification token.
    const { token, tokenHash, expires } = createToken(VERIFICATION_TTL_HOURS);
    await prisma.verificationToken.create({
      data: { identifier: user.email, token: tokenHash, expires },
    });
    await sendVerificationEmail(user.email, token);

    return genericSuccess;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      // Email already registered — do NOT reveal this to the caller. Log for ops
      // visibility and return the identical generic success.
      console.info('[auth/register] duplicate registration attempt (email exists)');
      return genericSuccess;
    }
    return serverError('auth/register', err);
  }
}
