import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from '@/lib/db/prisma';

/**
 * Auth.js database adapter, bound to the shared Prisma client.
 *
 * Isolated in its own module so the adapter wiring (Node-only) is imported solely
 * by lib/auth/auth.ts and never leaks into the Edge-safe config used by middleware.
 */
export const authAdapter: Adapter = PrismaAdapter(prisma);
