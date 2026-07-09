import { hashString } from '@/lib/utils';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * Stable version hash of the business config. Changes whenever any config field
 * changes, so cached content generated from an older config is detected as
 * stale at render time (and can be refreshed). Deterministic — no timestamps.
 */
export function businessConfigHash(config: BusinessConfig): string {
  return hashString(JSON.stringify(config)).toString(16);
}

/** Integrity hash of a content payload, for tamper/mismatch detection. */
export function contentHash(content: GeneratedPageContent): string {
  return hashString(JSON.stringify(content)).toString(16);
}
