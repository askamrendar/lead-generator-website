/**
 * Next.js instrumentation — runs ONCE per server process at startup.
 *
 * In-process background worker (long-lived deployments — Railway/Docker/VM):
 * when `JOBS_WORKER_TOKEN` is set and the runtime is Node, an interval POSTs the
 * app's own token-gated worker endpoint (`/api/jobs/run`) over loopback — the
 * SINGLE existing job-processing implementation. Queued jobs (AI generation,
 * blog, deployments) therefore process automatically with NO external cron.
 * Serverless keeps using an external scheduler; set `WORKER_INLINE=0` to
 * disable the loop explicitly.
 *
 * Self-fetch (instead of importing the jobs service here) keeps this file free
 * of `node:*` imports — Next bundles instrumentation for every runtime, and
 * webpack refuses `node:` schemes in that bundle. Ticks are serialized, errors
 * only log, and the endpoint's atomic QUEUED→RUNNING claim keeps an external
 * cron AND this loop safe to run together.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const token = process.env.JOBS_WORKER_TOKEN;
  if (!token) return; // worker not configured → nothing to run
  if (process.env.WORKER_INLINE === '0') return; // explicit opt-out

  const port = process.env.PORT || '3000';
  const url = `http://127.0.0.1:${port}/api/jobs/run`;
  const intervalMs = Math.max(5, Number(process.env.WORKER_INTERVAL_SECONDS) || 15) * 1000;
  let running = false;

  const tick = async () => {
    if (running) return; // never overlap ticks
    running = true;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { claimed?: number };
        if (data.claimed && data.claimed > 0) {
          console.info(`[worker] inline tick processed ${data.claimed} job(s)`);
        }
      } else {
        console.warn(`[worker] inline tick got ${res.status}`);
      }
    } catch (err) {
      // Server still booting or transient failure — next tick retries.
      console.warn('[worker] inline tick failed:', err instanceof Error ? err.message : err);
    } finally {
      running = false;
    }
  };

  // First tick after boot settles, then steady cadence.
  setTimeout(tick, 10_000);
  setInterval(tick, intervalMs);
  console.info(`[worker] inline background worker started (every ${intervalMs / 1000}s)`);
}
