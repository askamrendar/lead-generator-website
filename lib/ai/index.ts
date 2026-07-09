/**
 * AI Content Engine — public barrel.
 *
 * Import surface for the rest of the app. The engine is provider-agnostic and
 * runs fully offline via the deterministic fallback; configure a provider with
 * env vars (see `.env.example`) to switch on live AI.
 */

export type {
  PageType,
  PageContext,
  GeneratedPageContent,
  GenerationResult,
  GenerationMeta,
  AIProvider,
  AIConfig,
  ProviderName,
  ImagePrompt,
  Faq,
  CtaBlock,
  LinkAnchor,
} from '@/lib/ai/types';

export { getAIConfig, isAIEnabled } from '@/lib/ai/config';
export { getProvider, getProviderByName } from '@/lib/ai/providers';
export {
  generatePageContent,
  type GenerateOptions,
} from '@/lib/ai/services/content-service';
export { resolvePageContent, type RenderResult } from '@/lib/ai/render';
export { validateContent, repairContent } from '@/lib/ai/validation';
export { businessConfigHash, contentHash } from '@/lib/ai/hash';
export { deterministicContent } from '@/lib/ai/services/deterministic';
export { buildImagePrompts } from '@/lib/ai/services/image-prompts';
export { getCacheStore, contentKey } from '@/lib/ai/cache';
export { PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';

export * as agents from '@/lib/ai/agents';
export * as blog from '@/lib/ai/services/blog';
export * as context from '@/lib/ai/context';
