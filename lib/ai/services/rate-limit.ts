export interface LimiterOptions {
  /** Max concurrent in-flight tasks. */
  concurrency?: number;
  /** Minimum spacing between task starts, in ms. */
  minIntervalMs?: number;
}

/**
 * Tiny concurrency + spacing limiter for provider calls. Prevents bursts that
 * would trip provider rate limits during bulk generation.
 */
export function createLimiter(opts: LimiterOptions = {}) {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const minInterval = Math.max(0, opts.minIntervalMs ?? 0);

  let active = 0;
  let lastStart = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (active >= concurrency) return;
    const task = queue.shift();
    if (task) task();
  };

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
      next();
    });
    active++;
    if (minInterval > 0) {
      const now = Date.now();
      const wait = Math.max(0, lastStart + minInterval - now);
      lastStart = now + wait;
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
    try {
      return await fn();
    } finally {
      active--;
      next();
    }
  }

  return { run };
}

/** Shared limiter for the content service. */
export const providerLimiter = createLimiter({
  concurrency: Number(process.env.AI_CONCURRENCY ?? '4'),
  minIntervalMs: Number(process.env.AI_MIN_INTERVAL_MS ?? '0'),
});
