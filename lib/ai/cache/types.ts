import type { GeneratedPageContent } from '@/lib/ai/types';

/** Lifecycle status of a cached content version. */
export type ContentStatus =
  | 'draft'
  | 'published'
  | 'regenerated'
  | 'archived';

/**
 * A cached unit of generated content, with provenance + timestamp.
 * The trailing fields are optional so entries written by earlier phases still
 * parse (backward compatible).
 */
export interface CacheEntry {
  key: string;
  agentId: string;
  pageType: string;
  path: string;
  promptVersion: string;
  provider: string;
  model: string;
  /** ISO timestamp when this content was generated. */
  createdAt: string;
  content: GeneratedPageContent;
  // --- Phase 4 metadata (optional) ---
  /** Publication status; render reads non-archived entries. */
  status?: ContentStatus;
  /** Hash of the business config this content was generated from. */
  businessVersion?: string;
  /** Time-to-live in seconds; when elapsed the entry is treated as stale. */
  ttlSeconds?: number;
  /** Optional integrity hash of the content payload. */
  hash?: string;
}

/** Pluggable cache backend. */
export interface CacheStore {
  get(key: string): Promise<CacheEntry | undefined>;
  set(entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}
