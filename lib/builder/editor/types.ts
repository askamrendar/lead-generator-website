import type { PageDefinition, BlockInstance, ThemeId } from '@/lib/builder/types';

/**
 * Visual Builder document — the shape persisted in `Website.builderConfig`.
 *
 * It WRAPS the existing `PageDefinition` (the single page format — never a second
 * one) with editor-only metadata: theme, global style overrides, draft/published
 * status, and a bounded revision list. The renderer still consumes the inner
 * `PageDefinition` via `BlockRenderer`; nothing about rendering is duplicated here.
 *
 * `builderConfig` may legitimately be null (never opened) or a bare `PageDefinition`
 * (seeded elsewhere) — `normalizeDocument()` upgrades either into a `BuilderDocument`.
 */

export interface GlobalStyles {
  /** Optional brand/accent overrides (HSL "H S% L%") layered over the theme. */
  brand?: string;
  accent?: string;
  /** Optional font family + base radius overrides. */
  fontFamily?: string;
  radius?: string;
}

export type BuilderStatus = 'DRAFT' | 'PUBLISHED';

export interface Revision {
  id: string;
  /** ISO timestamp (caller-provided; the pure layer never reads the clock). */
  at: string;
  label: string;
  page: PageDefinition;
  themeId: ThemeId;
  globalStyles: GlobalStyles;
}

export interface BuilderDocument {
  /** Format marker for forward-compat migrations. */
  version: 1;
  /** The edited page (ordered blocks) — the reused PageDefinition format. */
  page: PageDefinition;
  themeId: ThemeId;
  globalStyles: GlobalStyles;
  status: BuilderStatus;
  /** Last published snapshot (what a live render would use). */
  published?: {
    page: PageDefinition;
    themeId: ThemeId;
    globalStyles: GlobalStyles;
    at: string;
  };
  /** Bounded revision history (newest first), capped by the service. */
  revisions: Revision[];
}

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

/** Re-export the block/page primitives the editor manipulates. */
export type { PageDefinition, BlockInstance, ThemeId };
