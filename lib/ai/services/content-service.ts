import { z } from 'zod';
import { getAIConfig } from '@/lib/ai/config';
import { getProvider } from '@/lib/ai/providers';
import { pagePromptTemplate, PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import { deterministicContent } from '@/lib/ai/services/deterministic';
import { repairContent } from '@/lib/ai/validation';
import { withRetry } from '@/lib/ai/services/retry';
import { providerLimiter } from '@/lib/ai/services/rate-limit';
import { contentKey, getCacheStore, isCacheEntryFresh } from '@/lib/ai/cache';
import { businessConfigHash, contentHash } from '@/lib/ai/hash';
import type {
  GeneratedPageContent,
  GenerationResult,
  PageContext,
  ProviderName,
} from '@/lib/ai/types';

/**
 * Content service — the single entry point for page content.
 *
 * Flow: cache → (if a live provider is configured) prompt + provider call →
 * validate + merge the AI draft over the deterministic baseline → cache. If no
 * provider is configured or the call fails, the deterministic baseline is used
 * unchanged. Either way a complete, valid GeneratedPageContent is returned.
 */

const str = z.string().min(1);
const draftFieldSchemas = {
  seoTitle: str,
  metaDescription: str,
  heroHeading: str,
  heroCopy: str,
  intro: str,
  locationIntro: str,
  benefits: z.array(str),
  whyChooseUs: z.array(str),
  process: z.array(z.object({ title: str, description: str })),
  faqs: z.array(z.object({ question: str, answer: str })),
  problems: z.array(z.object({ problem: str, solution: str })),
  stats: z.array(z.object({ value: str, label: str })),
  reviews: z.array(
    z.object({
      author: str,
      rating: z.number().min(1).max(5),
      body: str,
      location: z.string().optional(),
    }),
  ),
  cta: z.object({ title: str, description: str }),
  emergency: z.object({ title: str, description: str }),
} as const;

type DraftKey = keyof typeof draftFieldSchemas;

/** Tolerantly parse an AI response into a validated partial content object. */
function coerceDraft(text: string): Partial<GeneratedPageContent> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return {};
    try {
      raw = JSON.parse(text.slice(start, end + 1));
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== 'object') return {};

  const source = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(draftFieldSchemas) as DraftKey[]) {
    if (!(key in source)) continue;
    const parsed = draftFieldSchemas[key].safeParse(source[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  return out as Partial<GeneratedPageContent>;
}

function merge(
  base: GeneratedPageContent,
  draft: Partial<GeneratedPageContent>,
): GeneratedPageContent {
  // draft only contains validated, non-empty fields → shallow spread is safe.
  return { ...base, ...draft };
}

export interface GenerateOptions {
  /** Bypass the cache and force a fresh generation for this page only. */
  regenerate?: boolean;
}

export async function generatePageContent(
  ctx: PageContext,
  opts: GenerateOptions = {},
): Promise<GenerationResult> {
  const promptVersion = PROMPT_LIBRARY_VERSION;
  const agentId = `page:${ctx.pageType}`;
  const key = contentKey(ctx, promptVersion);
  const store = getCacheStore();
  const base = deterministicContent(ctx);

  if (!opts.regenerate) {
    const hit = await store.get(key);
    // Same freshness rules the render pipeline uses, so a cache hit here is
    // never staler than what a page would render (promptVersion + status +
    // businessVersion + TTL). Repair guarantees completeness on the way out.
    if (
      hit &&
      isCacheEntryFresh(hit, {
        promptVersion,
        businessVersion: businessConfigHash(ctx.business),
      })
    ) {
      return {
        content: repairContent(hit.content, base),
        meta: {
          provider: hit.provider as ProviderName,
          model: hit.model,
          cached: true,
          generatedAt: hit.createdAt,
          promptVersion: hit.promptVersion,
          agentId: hit.agentId,
          fallback: hit.provider === 'mock',
        },
      };
    }
  }

  const config = getAIConfig();
  const provider = getProvider();

  let content = base;
  let usedAI = false;

  if (config.enabled && provider.isConfigured()) {
    try {
      const { system, prompt } = pagePromptTemplate(ctx.pageType).build(ctx);
      const res = await withRetry(() =>
        providerLimiter.run(() =>
          provider.complete({
            system,
            prompt,
            json: true,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          }),
        ),
      );
      const draft = coerceDraft(res.text);
      if (Object.keys(draft).length > 0) {
        content = merge(base, draft);
        usedAI = true;
      }
    } catch {
      // Fall back to deterministic content on any provider/parse failure.
      content = base;
      usedAI = false;
    }
  }

  // Repair before caching so the stored + returned payload is complete and
  // de-duplicated — identical to what the render pipeline serves (it repairs on
  // read). Without this, /api/ai/generate could return content with duplicate
  // benefits or intro === heroCopy that the page itself would never show.
  content = repairContent(content, base);

  const providerName: ProviderName = usedAI ? provider.name : 'mock';
  const model = usedAI ? (config.model ?? provider.defaultModel) : 'deterministic';
  const generatedAt = new Date().toISOString();

  await store.set({
    key,
    agentId,
    pageType: ctx.pageType,
    path: ctx.path,
    promptVersion,
    provider: providerName,
    model,
    createdAt: generatedAt,
    content,
    status: 'published',
    businessVersion: businessConfigHash(ctx.business),
    hash: contentHash(content),
  });

  return {
    content,
    meta: {
      provider: providerName,
      model,
      cached: false,
      generatedAt,
      promptVersion,
      agentId,
      fallback: !usedAI,
    },
  };
}
