import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CacheEntry, CacheStore } from '@/lib/ai/cache/types';
import { MemoryCacheStore } from '@/lib/ai/cache/memory-store';

/**
 * File-backed cache with an in-memory read-through layer. Persists one JSON file
 * per entry under `.ai-cache/` (gitignored). All disk operations are guarded so
 * a read-only or serverless filesystem transparently degrades to memory-only.
 */
export class FileCacheStore implements CacheStore {
  private mem = new MemoryCacheStore();
  private dir: string;

  constructor(dir = path.join(process.cwd(), '.ai-cache')) {
    this.dir = dir;
  }

  private file(key: string): string {
    return path.join(this.dir, `${key}.json`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    const cached = await this.mem.get(key);
    if (cached) return cached;
    try {
      const raw = await fs.readFile(this.file(key), 'utf8');
      const entry = JSON.parse(raw) as CacheEntry;
      await this.mem.set(entry);
      return entry;
    } catch {
      return undefined;
    }
  }

  async set(entry: CacheEntry): Promise<void> {
    await this.mem.set(entry);
    try {
      await this.ensureDir();
      await fs.writeFile(
        this.file(entry.key),
        JSON.stringify(entry, null, 2),
        'utf8',
      );
    } catch {
      // Memory copy still holds; disk persistence is best-effort.
    }
  }

  async delete(key: string): Promise<boolean> {
    const inMem = await this.mem.delete(key);
    try {
      await fs.unlink(this.file(key));
      return true;
    } catch {
      return inMem;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));
    } catch {
      return this.mem.keys();
    }
  }
}
