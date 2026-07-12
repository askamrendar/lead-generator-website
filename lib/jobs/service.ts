// Phase 8.5 — Job queue service: enqueue, schedule, claim-and-run, monitoring.
// The worker entrypoint (/api/jobs/run) calls processDueJobs(). Jobs run as the
// SYSTEM; callers authorize at the enqueue site.
import { prisma } from '@/lib/db/prisma';
import { getHandler, QUEUES, type QueueName } from '@/lib/jobs/queues';
import { nextRetry } from '@/lib/jobs/policy';
import { emit } from '@/lib/jobs/events';
export interface EnqueueInput {
  queue: QueueName;
  type: string;
  payload?: Record<string, unknown>;
  workspaceId?: string;
  /** Optional website scope — denormalized to an indexed column for per-website lookups. */
  websiteId?: string;
  maxAttempts?: number;
  /** Delay before the job becomes due (seconds). Used for scheduled jobs. */
  delaySeconds?: number;
  now?: number; // injectable clock for tests
}

export async function enqueue(input: EnqueueInput) {
  const now = input.now ?? Date.now();
  const scheduledAt = new Date(now + (input.delaySeconds ?? 0) * 1000);
  // Denormalize websiteId from the explicit field or the payload so per-website
  // history queries hit an index instead of scanning the JSON payload.
  const websiteId =
    input.websiteId ??
    (typeof input.payload?.websiteId === 'string' ? (input.payload.websiteId as string) : undefined);
  return prisma.job.create({
    data: {
      queue: input.queue,
      type: input.type,
      payload: (input.payload as unknown as object) ?? undefined,
      workspaceId: input.workspaceId,
      websiteId,
      maxAttempts: input.maxAttempts ?? 3,
      scheduledAt,
    },
  });
}

/**
 * Reap stuck jobs: a job left `RUNNING` past the visibility timeout means its worker
 * crashed or was killed mid-handler. Requeue it (if attempts remain) or fail it, so the
 * queue is self-healing instead of silently leaking `RUNNING` rows forever. Runs each
 * worker tick before processing due jobs. Uses the `[status, startedAt]` index.
 */
export async function reapStuckJobs(visibilityTimeoutSeconds = 300, now = Date.now()) {
  const cutoff = new Date(now - visibilityTimeoutSeconds * 1000);
  const stuck = await prisma.job.findMany({
    where: {
      status: 'RUNNING',
      OR: [{ startedAt: { lt: cutoff } }, { startedAt: null }],
    },
    take: 100,
    select: { id: true, attempts: true, maxAttempts: true },
  });

  let requeued = 0;
  let failed = 0;
  for (const job of stuck) {
    const decision = nextRetry(job.attempts, job.maxAttempts, now);
    // Only transition rows still RUNNING (atomic guard against a racing worker/reaper).
    if (decision.retry && decision.scheduledAt) {
      const res = await prisma.job.updateMany({
        where: { id: job.id, status: 'RUNNING' },
        data: {
          status: 'QUEUED',
          scheduledAt: decision.scheduledAt,
          startedAt: null,
          error: 'Reaped: worker timed out or crashed mid-run.',
        },
      });
      requeued += res.count;
    } else {
      const res = await prisma.job.updateMany({
        where: { id: job.id, status: 'RUNNING' },
        data: {
          status: 'FAILED',
          finishedAt: new Date(now),
          error: 'Reaped: worker timed out or crashed; max attempts reached.',
        },
      });
      failed += res.count;
    }
  }
  return { reaped: requeued + failed, requeued, failed };
}

/**
 * Claim and run up to `limit` due jobs. Each job is claimed with an atomic
 * conditional update (status QUEUED → RUNNING) so concurrent workers don't
 * double-process. Returns a per-job outcome summary.
 */
export async function processDueJobs(limit = 10, now = Date.now()) {
  const due = await prisma.job.findMany({
    where: { status: 'QUEUED', scheduledAt: { lte: new Date(now) } },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
    select: { id: true },
  });

  const outcomes: Array<{ id: string; status: string; error?: string }> = [];
  for (const { id } of due) {
    // Atomic claim: only transitions if still QUEUED.
    const claim = await prisma.job.updateMany({
      where: { id, status: 'QUEUED' },
      data: { status: 'RUNNING', startedAt: new Date(now), attempts: { increment: 1 } },
    });
    if (claim.count === 0) continue; // lost the race

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) continue;

    const handler = getHandler(job.type);
    if (!handler) {
      await prisma.job.update({
        where: { id },
        data: { status: 'FAILED', finishedAt: new Date(now), error: `No handler for type "${job.type}"` },
      });
      outcomes.push({ id, status: 'FAILED', error: 'no-handler' });
      continue;
    }

    try {
      const result = await handler((job.payload as Record<string, unknown>) ?? {}, {
        jobId: job.id,
        attempt: job.attempts,
      });
      await prisma.job.update({
        where: { id },
        data: { status: 'SUCCEEDED', finishedAt: new Date(now), result: (result as unknown as object) ?? undefined, error: null },
      });
      await emit({ name: 'job.succeeded', workspaceId: job.workspaceId ?? undefined, data: { type: job.type, jobId: job.id } });
      outcomes.push({ id, status: 'SUCCEEDED' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const decision = nextRetry(job.attempts, job.maxAttempts, now);
      if (decision.retry && decision.scheduledAt) {
        await prisma.job.update({
          where: { id },
          data: { status: 'QUEUED', scheduledAt: decision.scheduledAt, error: message, startedAt: null },
        });
        outcomes.push({ id, status: 'RETRY', error: message });
      } else {
        await prisma.job.update({
          where: { id },
          data: { status: 'FAILED', finishedAt: new Date(now), error: message },
        });
        await emit({ name: 'job.failed', workspaceId: job.workspaceId ?? undefined, data: { type: job.type, jobId: job.id, error: message } });
        outcomes.push({ id, status: 'FAILED', error: message });
      }
    }
  }
  return { claimed: outcomes.length, outcomes };
}

/** Requeue a FAILED job for another run (manual retry from the dashboard). */
export async function retryJob(id: string, now = Date.now()) {
  await prisma.job.updateMany({
    where: { id, status: 'FAILED' },
    data: { status: 'QUEUED', scheduledAt: new Date(now), error: null, finishedAt: null, attempts: 0 },
  });
}

export async function cancelJob(id: string) {
  await prisma.job.updateMany({
    where: { id, status: 'QUEUED' },
    data: { status: 'CANCELLED', finishedAt: new Date() },
  });
}

/**
 * Jobs for a single website (indexed `websiteId` column), newest first. Reuses the Job
 * table — no per-website job store. Used by the AI-Generator tab for status + history.
 */
export async function jobsForWebsite(websiteId: string, type?: string, limit = 20) {
  return prisma.job.findMany({
    where: {
      ...(type ? { type } : {}),
      websiteId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export interface QueueHealth {
  queue: string;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
}

/** Monitoring snapshot: per-queue counts + recent jobs + overall health. */
export async function queueMonitoring(workspaceId?: string, limit = 25) {
  const where = workspaceId ? { workspaceId } : {};
  const grouped = await prisma.job.groupBy({
    by: ['queue', 'status'],
    where,
    _count: { _all: true },
  });

  const health: Record<string, QueueHealth> = {};
  for (const q of QUEUES) health[q] = { queue: q, queued: 0, running: 0, succeeded: 0, failed: 0 };
  for (const row of grouped) {
    const h = (health[row.queue] ??= { queue: row.queue, queued: 0, running: 0, succeeded: 0, failed: 0 });
    const n = row._count._all;
    if (row.status === 'QUEUED') h.queued += n;
    else if (row.status === 'RUNNING') h.running += n;
    else if (row.status === 'SUCCEEDED') h.succeeded += n;
    else if (row.status === 'FAILED') h.failed += n;
  }

  const [recent, totals] = await Promise.all([
    prisma.job.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.job.groupBy({ by: ['status'], where, _count: { _all: true } }),
  ]);

  const totalByStatus: Record<string, number> = {};
  for (const t of totals) totalByStatus[t.status] = t._count._all;

  return {
    queues: Object.values(health),
    recent,
    totals: totalByStatus,
    failed: recent.filter((j) => j.status === 'FAILED'),
  };
}
