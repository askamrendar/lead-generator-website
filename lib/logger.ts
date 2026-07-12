/**
 * Structured, dependency-free logger (Task 7).
 *
 * - Log levels with an env-configurable threshold (`LOG_LEVEL`).
 * - JSON output in production (machine-parseable), pretty text in development.
 * - Request IDs + error IDs for correlation (`newId`).
 *
 * Node runtime only (uses `console` + `node:crypto` fallback). Existing call sites
 * that use `console.*` keep working — this is additive; migrate incrementally.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = (process.env.LOG_LEVEL as LogLevel | undefined) ?? undefined;
  if (configured && configured in LEVEL_RANK) return LEVEL_RANK[configured];
  return process.env.NODE_ENV === 'production' ? LEVEL_RANK.info : LEVEL_RANK.debug;
}

/** Short correlation id (request id / error id). Not security-sensitive. */
export function newId(prefix = ''): string {
  // Avoid Math.random / Date.now determinism concerns: use crypto when available.
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c && 'randomUUID' in c) return `${prefix}${c.randomUUID().slice(0, 8)}`;
  } catch {
    /* fall through */
  }
  return `${prefix}${(process.hrtime.bigint() % 0xffffffffn).toString(16)}`;
}

export interface LogFields {
  [key: string]: unknown;
  /** Correlation id for a request/operation. */
  requestId?: string;
  /** Stable id attached to an error response for support. */
  errorId?: string;
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  if (LEVEL_RANK[level] < threshold()) return;

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    // Structured JSON line. `time` is set by the runtime sink; we avoid Date.now here
    // to keep the module import-safe in restricted contexts.
    const record = { level, msg: message, ...(fields ?? {}) };
    const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    sink(JSON.stringify(record));
    return;
  }

  // Pretty dev output.
  const tag = `[${level.toUpperCase()}]`;
  const extra = fields && Object.keys(fields).length ? fields : undefined;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (extra) sink(tag, message, extra);
  else sink(tag, message);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit('debug', message, fields),
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => emit('error', message, fields),
  /** Bind a set of fields (e.g. `{ requestId }`) to every subsequent call. */
  child(bound: LogFields) {
    return {
      debug: (m: string, f?: LogFields) => emit('debug', m, { ...bound, ...f }),
      info: (m: string, f?: LogFields) => emit('info', m, { ...bound, ...f }),
      warn: (m: string, f?: LogFields) => emit('warn', m, { ...bound, ...f }),
      error: (m: string, f?: LogFields) => emit('error', m, { ...bound, ...f }),
    };
  },
};
