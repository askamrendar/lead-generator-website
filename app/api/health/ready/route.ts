import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateEnv } from '@/lib/env';
import { logger, newId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Readiness probe (Task 8). Verifies the process can actually serve traffic:
 * database reachable + required env present. Returns 503 when not ready so a load
 * balancer withholds traffic. Public but leaks nothing sensitive (booleans only).
 */
export async function GET() {
  const requestId = newId('req_');
  const env = validateEnv();

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    logger.error('readiness: database check failed', { requestId, err: String(err) });
  }

  const ready = dbOk && env.ok;
  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database: dbOk,
        env: env.ok,
        missingEnv: env.missing,
      },
      requestId,
    },
    { status: ready ? 200 : 503 },
  );
}
