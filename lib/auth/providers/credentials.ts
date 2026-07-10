import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { loginSchema } from '@/lib/auth/validation';

/**
 * Email + password sign-in.
 *
 * Node-only (touches Prisma + scrypt) — it is attached in lib/auth/auth.ts and must
 * never be imported by the Edge-safe config used in middleware. `authorize` returns
 * the minimal user record on success, or null on any failure (never throwing, so
 * Auth.js reports a generic credentials error without leaking which check failed).
 */
export const credentialsProvider = Credentials({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(raw) {
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) return null;

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.hashedPassword) return null;

    const ok = await verifyPassword(password, user.hashedPassword);
    if (!ok) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});
