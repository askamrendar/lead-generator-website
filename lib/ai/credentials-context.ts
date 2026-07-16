import { AsyncLocalStorage } from 'node:async_hooks';
import type { ProviderName } from '@/lib/ai/types';

/**
 * Per-request AI credential context (BYO API keys).
 *
 * The AI engine historically read provider keys from process.env deep inside
 * `getAIConfig()`/`getProviderKeyEnv()`. Multi-tenant SaaS needs per-workspace
 * keys WITHOUT threading credentials through every call site — so this module
 * provides an AsyncLocalStorage scope:
 *
 *   await withAiCredentials({ provider: 'openai', apiKey, model }, () => generateWebsite(biz));
 *
 * `getAIConfig()` and `getProviderKeyEnv()` consult the active scope FIRST and
 * fall back to the environment, so:
 *   - workspace key set   → that workspace's generations use it (isolated per request)
 *   - no workspace key    → env keys (self-hosted/single-tenant) keep working
 *   - neither             → deterministic mock engine (offline-first, unchanged)
 */

export interface AiCredentials {
  provider: ProviderName;
  apiKey: string;
  /** Optional model override (falls back to the provider default). */
  model?: string;
}

const store = new AsyncLocalStorage<AiCredentials>();

/** Run `fn` with `creds` active for every AI call inside it (including awaits). */
export function withAiCredentials<T>(creds: AiCredentials | null, fn: () => T): T {
  if (!creds || !creds.apiKey) return fn();
  return store.run(creds, fn);
}

/** The credentials active for the current async context, if any. */
export function activeAiCredentials(): AiCredentials | null {
  return store.getStore() ?? null;
}
