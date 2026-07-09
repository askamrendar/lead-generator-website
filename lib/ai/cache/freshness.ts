import type { CacheEntry } from '@/lib/ai/cache/types';

/**
 * Shared cache-freshness rules — the SINGLE definition of whether a cached
 * entry may still be served. Both readers use it so they can never disagree:
 *   - `lib/ai/render.ts` (render-time, read-only page resolver), and
 *   - `lib/ai/services/content-service.ts` (generation-time cache short-circuit).
 *
 * Before this was extracted, render checked promptVersion + status +
 * businessVersion + TTL while the content service checked promptVersion only,
 * so a config change made the two return different content for the same page.
 *
 * The predicate is dependency-free: callers pass the expected prompt/business
 * versions rather than importing the prompt library or hashing here, which keeps
 * the cache layer decoupled and easy to unit-test.
 */
export interface FreshnessCriteria {
  /** The active prompt-library version an entry must match. */
  promptVersion: string;
  /** Expected business-config hash; when set, the entry must match it. */
  businessVersion?: string;
  /** Clock override for testing (defaults to Date.now()). */
  now?: number;
}

/** True when the entry is still valid to serve for the given criteria. */
export function isCacheEntryFresh(
  entry: CacheEntry,
  criteria: FreshnessCriteria,
): boolean {
  // Prompt-library version bump invalidates everything.
  if (entry.promptVersion !== criteria.promptVersion) return false;

  // Only publishable statuses may be served.
  if (entry.status === 'archived' || entry.status === 'draft') return false;

  // Business config changed since generation → stale.
  if (
    entry.businessVersion &&
    criteria.businessVersion &&
    entry.businessVersion !== criteria.businessVersion
  ) {
    return false;
  }

  // Optional TTL: enforced only when a positive value was written.
  if (entry.ttlSeconds && entry.ttlSeconds > 0) {
    const now = criteria.now ?? Date.now();
    const ageSeconds = (now - new Date(entry.createdAt).getTime()) / 1000;
    if (ageSeconds > entry.ttlSeconds) return false;
  }

  return true;
}
