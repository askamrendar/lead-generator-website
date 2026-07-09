import { deterministicContent } from '@/lib/ai/services/deterministic';
import { repairContent } from '@/lib/ai/validation';
import { contentKey, getCacheStore, isCacheEntryFresh } from '@/lib/ai/cache';
import type { CacheEntry } from '@/lib/ai/cache';
import { businessConfigHash } from '@/lib/ai/hash';
import { PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import type {
  GeneratedPageContent,
  GenerationMeta,
  PageContext,
  ProviderName,
} from '@/lib/ai/types';

/**
 * Render pipeline — the read-only, cache-first content resolver used by pages.
 *
 *   Business Config → Page Context → Cache Lookup → (validate) → AI content
 *                                              ↘ (miss/stale/invalid) → Fallback
 *
 * This NEVER calls a provider and never writes the cache, so rendering can never
 * block on the network or trip provider costs. Generation happens out-of-band
 * (build pre-generation, the /api/ai/* endpoints, or the admin utilities), which
 * populate `.ai-cache/`. If nothing is cached, the deterministic content renders
 * — so a page is never empty and offline builds always succeed.
 */

export interface RenderResult {
  content: GeneratedPageContent;
  meta: GenerationMeta;
  /** Where the content came from. */
  source: 'ai' | 'fallback';
}

/** Is a cache entry usable AND genuine AI content for the current page + config? */
function isEntryUsable(entry: CacheEntry, ctx: PageContext): boolean {
  // Shared freshness rules (promptVersion + status + businessVersion + TTL).
  if (
    !isCacheEntryFresh(entry, {
      promptVersion: PROMPT_LIBRARY_VERSION,
      businessVersion: businessConfigHash(ctx.business),
    })
  ) {
    return false;
  }
  // A mock/fallback entry is fresh but not "AI" — treat as fallback so the
  // rendered source isn't mislabeled. (Render-specific; the generator does not
  // apply this, since a fresh deterministic entry is still a valid cache hit.)
  return entry.provider !== 'mock';
}

function fallbackMeta(): GenerationMeta {
  return {
    provider: 'mock' as ProviderName,
    model: 'deterministic',
    cached: false,
    generatedAt: new Date(0).toISOString(),
    promptVersion: PROMPT_LIBRARY_VERSION,
    agentId: 'deterministic',
    fallback: true,
  };
}

/**
 * Resolve the content for a page, cache-first with deterministic fallback.
 * Safe to call from Server Components and generateMetadata.
 */
export async function resolvePageContent(
  ctx: PageContext,
): Promise<RenderResult> {
  const fallback = deterministicContent(ctx);

  try {
    const store = getCacheStore();
    const key = contentKey(ctx, PROMPT_LIBRARY_VERSION);
    const entry = await store.get(key);
    if (entry && isEntryUsable(entry, ctx)) {
      // Repair guarantees completeness even if the cached payload drifted.
      const content = repairContent(entry.content, fallback);
      return {
        content,
        source: 'ai',
        meta: {
          provider: entry.provider as ProviderName,
          model: entry.model,
          cached: true,
          generatedAt: entry.createdAt,
          promptVersion: entry.promptVersion,
          agentId: entry.agentId,
          fallback: false,
        },
      };
    }
  } catch {
    // Any cache/read error → deterministic fallback. Never throw at render.
  }

  return { content: fallback, source: 'fallback', meta: fallbackMeta() };
}
