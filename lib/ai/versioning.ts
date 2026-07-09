import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getCacheStore } from '@/lib/ai/cache';
import type { CacheEntry, ContentStatus } from '@/lib/ai/cache/types';

/**
 * Content versioning.
 *
 * The cache holds the *current* published entry; this module keeps a bounded
 * history of prior versions per key under `.ai-cache/history/<key>.json` and
 * supports status transitions (draft → published → regenerated → archived) plus
 * rollback. All disk ops are guarded, degrading to a no-op if the FS is
 * read-only.
 */

const HISTORY_DIR = path.join(process.cwd(), '.ai-cache', 'history');
const MAX_HISTORY = 10;

function historyFile(key: string): string {
  return path.join(HISTORY_DIR, `${key}.json`);
}

export async function listVersions(key: string): Promise<CacheEntry[]> {
  try {
    const raw = await fs.readFile(historyFile(key), 'utf8');
    return JSON.parse(raw) as CacheEntry[];
  } catch {
    return [];
  }
}

async function writeHistory(key: string, versions: CacheEntry[]): Promise<void> {
  try {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
    await fs.writeFile(
      historyFile(key),
      JSON.stringify(versions.slice(-MAX_HISTORY), null, 2),
      'utf8',
    );
  } catch {
    // best-effort
  }
}

/**
 * Archive the current entry for `key` (mark it archived and push to history).
 * Call this before overwriting with a regenerated version to preserve rollback.
 */
export async function archiveCurrent(key: string): Promise<boolean> {
  const store = getCacheStore();
  const current = await store.get(key);
  if (!current) return false;
  const versions = await listVersions(key);
  versions.push({ ...current, status: 'archived' });
  await writeHistory(key, versions);
  return true;
}

/** Update the status of the current entry (e.g. draft → published). */
export async function setStatus(
  key: string,
  status: ContentStatus,
): Promise<boolean> {
  const store = getCacheStore();
  const current = await store.get(key);
  if (!current) return false;
  await store.set({ ...current, status });
  return true;
}

/**
 * Roll the current entry back to the most recent archived version.
 * Returns the restored entry, or undefined if there is no history.
 */
export async function rollback(key: string): Promise<CacheEntry | undefined> {
  const store = getCacheStore();
  const versions = await listVersions(key);
  const previous = versions.pop();
  if (!previous) return undefined;

  // Preserve the version we're leaving, then restore the previous one.
  const current = await store.get(key);
  if (current) versions.push({ ...current, status: 'archived' });
  await writeHistory(key, versions);

  const restored: CacheEntry = {
    ...previous,
    status: 'published',
    createdAt: new Date().toISOString(),
  };
  await store.set(restored);
  return restored;
}
