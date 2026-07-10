import { NextResponse } from 'next/server';
import { enforceRateLimit, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { resetPasswordSchema } from '@/lib/auth/validation';
import { hashToken, isExpired } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

/**
 * Complete a password reset with a single-use token. Consumes the token (marks it
 * used and clears any other outstanding reset tokens for the user), sets the new
 * scrypt hash, and returns 400 on any invalid/expired/used token without detail.
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

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const tokenHash = hashToken(parsed.data.token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });
    if (!record || record.usedAt || isExpired(record.expires)) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { hashedPassword },
      }),
      // Mark this token used and invalidate any other outstanding reset tokens.
      prisma.passwordResetToken.update({
        where: { token: tokenHash },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, usedAt: null },
      }),
    ]);

    return NextResponse.json({ ok: true, message: 'Password updated.' });
  } catch (err) {
    return serverError('auth/reset-password', err);
  }
}
