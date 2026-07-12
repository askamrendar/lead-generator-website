import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api/security';
import { installHandlers } from '@/lib/jobs/handlers';
import { processDueJobs, reapStuckJobs } from '@/lib/jobs/service';
import { ensureRecurring } from '@/lib/jobs/scheduler';

export const runtime = 'nodejs';
// Cap the worker tick so a slow/hung handler can't run past the platform limit; the
// reaper + atomic claim make a killed tick safe to retry on the next invocation.
export const maxDuration = 60;

/**
 * Worker entrypoint — processes due jobs and schedules recurring ones. Invoked by
 * an external scheduler (cron / Vercel Cron / a `curl` loop), NOT by end users.
 * Authorized by a shared secret: set JOBS_WORKER_TOKEN and pass it as
 * `Authorization: Bearer <token>` or `?token=`. Without the env var set, the
 * endpoint refuses to run (fail-closed) so it can't be triggered anonymously.
 */
function authorized(request: Request): boolean {
  const expected = process.env.JOBS_WORKER_TOKEN;
  if (!expected) return false; // not configured → refuse
  const header = request.headers.get('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const url = new URL(request.url);
  const qs = url.searchParams.get('token');
  return bearer === expected || qs === expected;
}

async function handle(request: Request) {
  if (!process.env.JOBS_WORKER_TOKEN) {
    return NextResponse.json(
      { error: 'Worker not configured', hint: 'Set JOBS_WORKER_TOKEN to enable the background worker.' },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    installHandlers();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 50);
    const scheduled = await ensureRecurring();
    const reaped = await reapStuckJobs();
    const processed = await processDueJobs(limit);
    return NextResponse.json({ ok: true, scheduled: scheduled.scheduled, reaped, ...processed });
  } catch (err) {
    return serverError('jobs/run', err);
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
