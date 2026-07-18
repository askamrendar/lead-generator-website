import { royalOakPack } from './royal-oak/pack.ts';
import { template2Pack } from './template-2/pack.ts';
import type { HtmlPack } from './types';

/**
 * HTML template-pack registry. Packs are numbered user-facing ("Template 1",
 * "Template 2", …) — never business/reference names. Adding a pack = one
 * sibling directory under templates/html/ + one entry here.
 *
 * Relative `.ts` imports keep this module loadable by the `node --test`
 * type-stripping runner (the `@/` alias does not resolve there).
 */
export const htmlPackRegistry: Record<string, HtmlPack> = {
  'template-1': royalOakPack,
  'template-2': template2Pack,
};

/** Legacy ids stored on existing Website rows — resolved read-side, never rewritten. */
const ALIASES: Record<string, string> = {
  'royal-oak': 'template-1',
};

export const DEFAULT_HTML_PACK_ID = 'template-1';

/** Alias → canonical; unknown/missing ids fall back to the default pack. */
export function resolveHtmlPackId(id?: string | null): string {
  if (!id) return DEFAULT_HTML_PACK_ID;
  const canonical = ALIASES[id] ?? id;
  return canonical in htmlPackRegistry ? canonical : DEFAULT_HTML_PACK_ID;
}

export function getHtmlPack(id?: string | null): HtmlPack {
  return htmlPackRegistry[resolveHtmlPackId(id)];
}

/** Strict membership check (canonical ids only) — for user-facing setters. */
export function isHtmlPackId(id: string): boolean {
  return id in htmlPackRegistry;
}

export function listHtmlPacks(): Array<{ id: string; displayName: string; description: string }> {
  return Object.values(htmlPackRegistry).map(({ id, displayName, description }) => ({
    id,
    displayName,
    description,
  }));
}
