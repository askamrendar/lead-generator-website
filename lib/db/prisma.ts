import { PrismaClient } from '@prisma/client';

/**
 * Single shared `PrismaClient` instance.
 *
 * Next.js dev/HMR re-evaluates modules, which would otherwise open a new pool of
 * connections on every reload and exhaust the database. Caching the client on
 * `globalThis` keeps exactly one instance per process. Runtime: `nodejs` only —
 * never import this from Edge (middleware) code.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
