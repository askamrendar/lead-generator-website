import type { CSSProperties } from 'react';
import type { ThemeTokens } from '@/lib/builder/types';
import { DEFAULT_FONT } from '@/themes/registry';

/**
 * Serialize a theme to CSS custom properties. These map directly onto the
 * variables the Tailwind config + globals already consume, so applying them to
 * any wrapper element re-themes the whole subtree — no rebuild needed.
 */
export function themeCssVars(theme: ThemeTokens): CSSProperties {
  const c = theme.colors;
  return {
    '--background': c.background,
    '--foreground': c.foreground,
    '--muted': c.muted,
    '--muted-fg': c.mutedFg,
    '--border': c.border,
    '--brand': c.brand,
    '--brand-fg': c.brandFg,
    '--accent': c.accent,
    '--accent-fg': c.accentFg,
    '--radius': theme.radius,
    '--font-sans': theme.font ?? DEFAULT_FONT,
  } as CSSProperties;
}
