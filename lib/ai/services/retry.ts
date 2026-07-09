export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` with exponential backoff. Used to wrap provider calls so transient
 * 429/5xx errors recover automatically without failing a generation.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 8000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const delay = Math.min(max, base * 2 ** attempt);
      await sleep(delay);
    }
  }
  throw lastError;
}
