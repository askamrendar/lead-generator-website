import { handlers } from '@/lib/auth/auth';

/**
 * Auth.js core endpoints (sign-in/out, OAuth callbacks, session, CSRF).
 * Node runtime — the Prisma adapter and scrypt Credentials are Node-only.
 */
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
