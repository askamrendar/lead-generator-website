import { hashString } from '@/lib/utils';
import type { PageContext } from '@/lib/ai/types';

/**
 * Stable cache key for a page's content. Keyed by page identity + prompt
 * version so bumping PROMPT_LIBRARY_VERSION transparently invalidates stale
 * content. Provider/model are recorded on the entry but not in the key, so
 * switching providers reuses cache until an explicit regeneration.
 */
export function contentKey(ctx: PageContext, promptVersion: string): string {
  const identity = [
    ctx.pageType,
    ctx.path,
    ctx.business.name,
    promptVersion,
  ].join('|');
  return `${ctx.pageType}-${hashString(identity).toString(16)}`;
}
