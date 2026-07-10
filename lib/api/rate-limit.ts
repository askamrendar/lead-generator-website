/**
 * In-memory sliding-window rate limiter.
 *
 * A per-key timestamp log is pruned to the active window on each hit; a request
 * is allowed only while the log length is under the limit. This is precise
 * (true sliding window, not fixed buckets) and dependency-free.
 *
 * Scope: per server instance. On serverless/multi-instance deployments each
 * instance keeps its own counters — swap `buckets` for a shared store (Redis,
 * Upstash) when you scale horizontally. Documented in SECURITY.md.
 */

export interface RateLimitConfig {
  /** Max requests permitted within the window. */
  limit: number;
  /** Sliding window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the caller may retry (0 when ok). */
  retryAfterSec: number;
  /** Unix seconds when the window frees up. */
  resetSec: number;
}

const buckets = new Map<string, number[]>();

/** Env-tunable named limits (requests / window). */
function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export const LIMITS = {
  /** Public lead submissions. */
  lead: (): RateLimitConfig => ({
    limit: envInt('RATE_LIMIT_LEAD', 5),
    windowMs: envInt('RATE_LIMIT_LEAD_WINDOW_MS', 60_000),
  }),
  /** Public generator validation endpoint. */
  generate: (): RateLimitConfig => ({
    limit: envInt('RATE_LIMIT_GENERATE', 10),
    windowMs: envInt('RATE_LIMIT_GENERATE_WINDOW_MS', 60_000),
  }),
  /** Admin AI read endpoints (status/provider/prompts/cache list). */
  aiRead: (): RateLimitConfig => ({
    limit: envInt('RATE_LIMIT_AI_READ', 60),
    windowMs: envInt('RATE_LIMIT_AI_READ_WINDOW_MS', 60_000),
  }),
  /** Admin AI mutating/cost endpoints (generate/regenerate/batch/cache mutate). */
  aiWrite: (): RateLimitConfig => ({
    limit: envInt('RATE_LIMIT_AI_WRITE', 10),
    windowMs: envInt('RATE_LIMIT_AI_WRITE_WINDOW_MS', 60_000),
  }),
  /** Public auth endpoints (register / forgot-password / reset / verify). */
  auth: (): RateLimitConfig => ({
    limit: envInt('RATE_LIMIT_AUTH', 5),
    windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 60_000),
  }),
};

/** Best-effort client identifier from proxy headers, falling back to a constant. */
export function clientId(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'anonymous'
  );
}

/** Record a hit and report whether it is within the limit. */
export function rateLimit(
  key: string,
  cfg: RateLimitConfig,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - cfg.windowMs;
  const log = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (log.length >= cfg.limit) {
    const oldest = log[0]!;
    const retryMs = oldest + cfg.windowMs - now;
    buckets.set(key, log);
    return {
      ok: false,
      limit: cfg.limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)),
      resetSec: Math.ceil((oldest + cfg.windowMs) / 1000),
    };
  }

  log.push(now);
  buckets.set(key, log);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      const pruned = v.filter((t) => t > windowStart);
      if (pruned.length === 0) buckets.delete(k);
      else buckets.set(k, pruned);
    }
  }

  return {
    ok: true,
    limit: cfg.limit,
    remaining: Math.max(0, cfg.limit - log.length),
    retryAfterSec: 0,
    resetSec: Math.ceil((now + cfg.windowMs) / 1000),
  };
}

/** Testing/maintenance hook. */
export function __resetRateLimiter(): void {
  buckets.clear();
}
