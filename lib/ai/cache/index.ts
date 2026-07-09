import type { CacheStore } from '@/lib/ai/cache/types';
import { FileCacheStore } from '@/lib/ai/cache/file-store';

let store: CacheStore | undefined;

/** Singleton cache store for the process. */
export function getCacheStore(): CacheStore {
  if (!store) store = new FileCacheStore();
  return store;
}

export type { CacheEntry, CacheStore } from '@/lib/ai/cache/types';
export { contentKey } from '@/lib/ai/cache/key';
export { isCacheEntryFresh, type FreshnessCriteria } from '@/lib/ai/cache/freshness';
export { FileCacheStore } from '@/lib/ai/cache/file-store';
export { MemoryCacheStore } from '@/lib/ai/cache/memory-store';
