import type { CacheEntry, CacheStore } from '@/lib/ai/cache/types';

/** Process-lifetime in-memory cache. Used as a fast layer and edge fallback. */
export class MemoryCacheStore implements CacheStore {
  private map = new Map<string, CacheEntry>();

  async get(key: string): Promise<CacheEntry | undefined> {
    return this.map.get(key);
  }
  async set(entry: CacheEntry): Promise<void> {
    this.map.set(entry.key, entry);
  }
  async delete(key: string): Promise<boolean> {
    return this.map.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }
}
