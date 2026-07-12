import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, serverError } from '@/lib/api/security';
import { newId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Operational metrics (Task 8). Admin-gated (fail-closed via ADMIN_API_TOKEN) and
 * SYSTEM-scoped (not tenant-scoped) — intended for monitoring, not end users. Reports
 * queue / deployment / AI / database counts from existing tables. No new models.
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const requestId = newId('req_');
  try {
    const [jobsByStatus, deploysByStatus, aiRuns, websites, users, domains, media] =
      await Promise.all([
        prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.deployment.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.aiRun.count(),
        prisma.website.count(),
        prisma.user.count(),
        prisma.domain.count(),
        prisma.mediaAsset.count(),
      ]);

    const toMap = (rows: Array<{ status: string; _count: { _all: number } }>) =>
      Object.fromEntries(rows.map((r) => [r.status, r._count._all]));

    let dbOk = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }

    return NextResponse.json({
      requestId,
      queue: { jobsByStatus: toMap(jobsByStatus) },
      deployments: { byStatus: toMap(deploysByStatus) },
      ai: { totalRuns: aiRuns },
      database: { ok: dbOk },
      totals: { websites, users, domains, mediaAssets: media },
    });
  } catch (err) {
    return serverError('health/metrics', err);
  }
}
