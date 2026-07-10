import { NextResponse } from 'next/server';
import { enforceRateLimit, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';
import { verifyEmailSchema } from '@/lib/auth/validation';
import { hashToken, isExpired } from '@/lib/auth/tokens';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

/**
 * Consume an email-verification token (single-use). Supports GET (the link in the
 * email → `?token=`) and POST (JSON body), both validated the same way. Expired or
 * unknown tokens return 400 without revealing which; the token row is always
 * removed after a successful verification.
 */
async function verify(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  if (isExpired(record.expires)) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } });
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: tokenHash } }),
  ]);

  return NextResponse.json({ ok: true, message: 'Email verified.' });
}

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'auth', LIMITS.auth());
  if (limited) return limited;
  try {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    const parsed = verifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    return await verify(parsed.data.token);
  } catch (err) {
    return serverError('auth/verify-email', err);
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'auth', LIMITS.auth());
  if (limited) return limited;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  try {
    return await verify(parsed.data.token);
  } catch (err) {
    return serverError('auth/verify-email', err);
  }
}
