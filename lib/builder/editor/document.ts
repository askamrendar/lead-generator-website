import type { PageDefinition, ThemeId } from '@/lib/builder/types';
import { ensureIds } from './operations.ts';
import type {
  BuilderDocument,
  GlobalStyles,
  Revision,
} from './types.ts';

/**
 * Pure `BuilderDocument` helpers — normalization, publish, and revision management.
 * No I/O and no clock: timestamps/ids are passed in by the caller (service layer),
 * keeping this unit-testable. Relative `.ts` imports so the Node test runner resolves them.
 */

const DEFAULT_THEME: ThemeId = 'modern';
const REVISION_LIMIT = 20;

function isBuilderDocument(value: unknown): value is BuilderDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { version?: unknown }).version === 1 &&
    'page' in value
  );
}

function isBarePage(value: unknown): value is PageDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { blocks?: unknown }).blocks)
  );
}

/**
 * Upgrade whatever is stored in `builderConfig` into a normalized BuilderDocument.
 * Accepts: an existing document, a bare PageDefinition, or null/garbage (→ seed page).
 * Block ids are always ensured so the editor can select/drag reliably.
 */
export function normalizeDocument(
  raw: unknown,
  seedPage: PageDefinition,
  seedThemeId: ThemeId = DEFAULT_THEME,
): BuilderDocument {
  if (isBuilderDocument(raw)) {
    return { ...raw, page: ensureIds(raw.page), revisions: raw.revisions ?? [] };
  }
  const page = isBarePage(raw) ? raw : seedPage;
  return {
    version: 1,
    page: ensureIds(page),
    themeId: seedThemeId,
    globalStyles: {},
    status: 'DRAFT',
    revisions: [],
  };
}

/** Replace the working page (marks the doc back to DRAFT). */
export function withPage(doc: BuilderDocument, page: PageDefinition): BuilderDocument {
  return { ...doc, page, status: 'DRAFT' };
}

export function withTheme(doc: BuilderDocument, themeId: ThemeId): BuilderDocument {
  return { ...doc, themeId, status: 'DRAFT' };
}

export function withGlobalStyles(doc: BuilderDocument, styles: GlobalStyles): BuilderDocument {
  return { ...doc, globalStyles: { ...doc.globalStyles, ...styles }, status: 'DRAFT' };
}

/** Prepend a capped revision snapshot of the CURRENT working state. */
export function snapshot(doc: BuilderDocument, id: string, at: string, label: string): BuilderDocument {
  const rev: Revision = {
    id,
    at,
    label,
    page: doc.page,
    themeId: doc.themeId,
    globalStyles: doc.globalStyles,
  };
  return { ...doc, revisions: [rev, ...doc.revisions].slice(0, REVISION_LIMIT) };
}

/** Restore a revision into the working state (does not itself snapshot). */
export function restoreRevision(doc: BuilderDocument, revisionId: string): BuilderDocument {
  const rev = doc.revisions.find((r) => r.id === revisionId);
  if (!rev) return doc;
  return { ...doc, page: rev.page, themeId: rev.themeId, globalStyles: rev.globalStyles, status: 'DRAFT' };
}

/** Publish the working state: copies it to `published` and flips status. */
export function publish(doc: BuilderDocument, at: string): BuilderDocument {
  return {
    ...doc,
    status: 'PUBLISHED',
    published: { page: doc.page, themeId: doc.themeId, globalStyles: doc.globalStyles, at },
  };
}
