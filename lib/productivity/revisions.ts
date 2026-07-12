// Phase 9 — Single-User Productivity. Pure version-history helpers (no I/O, tested).

export interface Revision {
  id: string;
  at: string; // ISO timestamp
  label: string;
  builderConfig?: unknown;
  businessConfig?: unknown;
}

export const MAX_REVISIONS = 25;

/** Prepend a new revision, newest-first, bounded to MAX_REVISIONS. Pure. */
export function pushRevision(existing: unknown, next: Revision, max = MAX_REVISIONS): Revision[] {
  const list = Array.isArray(existing) ? (existing as Revision[]) : [];
  return [next, ...list].slice(0, max);
}

/** Read the stored revisions as a typed array (defensive against bad JSON). */
export function readRevisions(raw: unknown): Revision[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is Revision => !!r && typeof r === 'object' && typeof (r as Revision).id === 'string',
  );
}

/** Find one revision by id. Pure. */
export function findRevision(raw: unknown, id: string): Revision | null {
  return readRevisions(raw).find((r) => r.id === id) ?? null;
}
