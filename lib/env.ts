import { z } from 'zod';

/**
 * Centralized environment access + validation (Task 6).
 *
 * Design contract: parsing NEVER throws at import or build time — every variable is
 * optional in the schema, so merely importing this file cannot turn a green
 * `next build` (with a minimal env) red. Production *requirements* are enforced
 * explicitly via `validateEnv()`/`assertEnv()` (used by the readiness endpoint and an
 * optional startup script), NOT implicitly at import. This keeps the offline-first
 * build contract intact while still giving a single, typed source for env access.
 */

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Prisma — pooled + direct)
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  // Auth.js
  AUTH_SECRET: z.string().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),

  // Public site origin (drives canonical URLs / SEO)
  NEXT_PUBLIC_SITE_URL: z.string().optional(),

  // Background worker entrypoint token (Phase 8.5)
  JOBS_WORKER_TOKEN: z.string().optional(),

  // Admin API token (fail-closed admin endpoints)
  ADMIN_API_TOKEN: z.string().optional(),

  // Provider-secret encryption key (Task 5, when enabled)
  SECRET_ENCRYPTION_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // AI providers (optional — features gate on presence, never fabricate)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Typed, memoized view of the environment. Never throws (falls back permissively). */
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  cached = parsed.success ? parsed.data : (process.env as unknown as Env);
  return cached;
}

/** Variables that MUST be present in a production runtime. */
const PRODUCTION_REQUIRED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export interface EnvValidation {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Report missing production-required vars + non-fatal warnings. Safe to call
 * anywhere (does not throw). In non-production it always reports `ok: true`.
 */
export function validateEnv(): EnvValidation {
  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
  const missing: string[] = [];
  const warnings: string[] = [];

  if (isProd) {
    for (const key of PRODUCTION_REQUIRED) {
      if (!process.env[key]) missing.push(key);
    }
    if (!process.env.JOBS_WORKER_TOKEN) {
      warnings.push('JOBS_WORKER_TOKEN unset — the background worker endpoint is disabled.');
    }
    if (!process.env.SECRET_ENCRYPTION_KEY) {
      warnings.push('SECRET_ENCRYPTION_KEY unset — provider secrets are not encrypted at rest.');
    }
    if (!process.env.ADMIN_API_TOKEN) {
      warnings.push('ADMIN_API_TOKEN unset — admin/metrics endpoints are disabled.');
    }
  }

  return { ok: missing.length === 0, missing, warnings };
}

/**
 * Fail-fast startup guard. Call from a deploy/boot script (NOT at import) to abort a
 * misconfigured production start with a helpful message.
 */
export function assertEnv(): void {
  const { ok, missing } = validateEnv();
  if (!ok) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See .env.example for the full list.`,
    );
  }
}
