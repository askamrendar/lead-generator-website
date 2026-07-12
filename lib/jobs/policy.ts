// Phase 8.5 — Background Infrastructure. Pure retry/backoff policy (no I/O, tested).

export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/** Exponential backoff with a cap, in seconds, for retry attempt `n` (1-based). */
export function backoffSeconds(attempt: number, baseSeconds = 30, capSeconds = 3600): number {
  if (attempt < 1) return baseSeconds;
  const raw = baseSeconds * Math.pow(2, attempt - 1);
  return Math.min(raw, capSeconds);
}

/** After a failed attempt, decide whether to retry and when the next run is due. */
export function nextRetry(
  attempts: number,
  maxAttempts: number,
  now: number,
  baseSeconds = 30,
): { retry: boolean; scheduledAt: Date | null } {
  if (attempts >= maxAttempts) return { retry: false, scheduledAt: null };
  const delay = backoffSeconds(attempts, baseSeconds) * 1000;
  return { retry: true, scheduledAt: new Date(now + delay) };
}

/** Terminal states never re-run. */
export function isTerminal(status: JobStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED';
}

/** A due job is QUEUED and its scheduledAt has passed. */
export function isDue(status: JobStatus, scheduledAt: number, now: number): boolean {
  return status === 'QUEUED' && scheduledAt <= now;
}

/** Next occurrence time for a recurring job from a last-run timestamp. Pure. */
export function nextOccurrence(lastRun: number, intervalSeconds: number): Date {
  return new Date(lastRun + intervalSeconds * 1000);
}

/**
 * A RUNNING job is "stuck" if it has been running longer than the visibility timeout —
 * i.e. its worker crashed or the platform killed it mid-handler. Pure. `startedAt` null
 * (claimed but timestamp missing) is treated as stuck so it can't linger forever.
 */
export function isStuck(
  status: JobStatus,
  startedAt: number | null,
  now: number,
  visibilityTimeoutSeconds = 300,
): boolean {
  if (status !== 'RUNNING') return false;
  if (startedAt == null) return true;
  return now - startedAt > visibilityTimeoutSeconds * 1000;
}
