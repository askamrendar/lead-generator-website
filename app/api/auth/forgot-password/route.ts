import { NextResponse } from 'next/server';
import { enforceRateLimit, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { forgotPasswordSchema } from '@/lib/auth/validation';
import { createToken } from '@/lib/auth/tokens';
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/auth/email';

export const runtime = 'nodejs';

const RESET_TTL_HOURS = Number(process.env.AUTH_PASSWORD_RESET_TTL_HOURS ?? 1);

/**
 * Request a password reset. Always responds with the same generic 200 whether or
 * not the email exists (no account enumeration). When a matching user is found, a
 * single-use hashed reset token is stored and emailed.
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const generic = NextResponse.json({
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true },
    });
    if (!user) return generic; // do not reveal absence

    const { token, tokenHash, expires } = createToken(RESET_TTL_HOURS);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: tokenHash, expires },
    });
    await sendPasswordResetEmail(user.email, token);

    return generic;
  } catch (err) {
    return serverError('auth/forgot-password', err);
  }
}
