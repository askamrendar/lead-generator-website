// Phase 8.5 — Scheduler for recurring jobs. Pure schedule math + an enqueue helper.
// A recurring job is described declaratively; the worker tick calls ensureRecurring()
// which enqueues the next occurrence when due and not already pending.
import { prisma } from '@/lib/db/prisma';
import { enqueue } from '@/lib/jobs/service';
import { nextOccurrence } from '@/lib/jobs/policy';
import type { QueueName } from '@/lib/jobs/queues';

export { nextOccurrence };

export interface RecurringJob {
  key: string; // stable identity used to avoid duplicate scheduling
  queue: QueueName;
  type: string;
  intervalSeconds: number;
  payload?: Record<string, unknown>;
}

/** Built-in recurring maintenance jobs. */
export const RECURRING: RecurringJob[] = [
  { key: 'maintenance.cleanup', queue: 'notification', type: 'maintenance.cleanup', intervalSeconds: 86_400, payload: { days: 30 } },
  { key: 'analytics.sync', queue: 'analytics-sync', type: 'analytics.sync', intervalSeconds: 3_600 },
];

/**
 * Enqueue any recurring job that has no pending (QUEUED/RUNNING) instance and
 * whose last run is older than its interval. Idempotent per tick.
 */
export async function ensureRecurring(now = Date.now()) {
  const scheduled: string[] = [];
  for (const job of RECURRING) {
    const pending = await prisma.job.count({
      where: { type: job.type, status: { in: ['QUEUED', 'RUNNING'] } },
    });
    if (pending > 0) continue;

    const last = await prisma.job.findFirst({
      where: { type: job.type, status: { in: ['SUCCEEDED', 'FAILED'] } },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });
    const due = !last?.finishedAt || nextOccurrence(last.finishedAt.getTime(), job.intervalSeconds).getTime() <= now;
    if (!due) continue;

    await enqueue({ queue: job.queue, type: job.type, payload: job.payload, now });
    scheduled.push(job.key);
  }
  return { scheduled };
}
