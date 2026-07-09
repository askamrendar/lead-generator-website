import type { ThemeId, ThemeTokens } from '@/lib/builder/types';

/**
 * Theme registry. Each theme is a set of design tokens (colors, radius, font)
 * that map onto the CSS variables the whole UI already reads
 * (`hsl(var(--brand))`, etc.). Swapping the theme re-skins every block.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const HUMANIST =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const themes: Record<ThemeId, ThemeTokens> = {
  light: {
    id: 'light',
    name: 'Light',
    dark: false,
    radius: '0.75rem',
    colors: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '210 40% 96%',
      mutedFg: '215 16% 40%',
      border: '214 32% 91%',
      brand: '221 83% 53%',
      brandFg: '0 0% 100%',
      accent: '24 95% 53%',
      accentFg: '0 0% 100%',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    dark: true,
    radius: '0.75rem',
    colors: {
      background: '222 47% 8%',
      foreground: '210 40% 98%',
      muted: '217 33% 17%',
      mutedFg: '215 20% 65%',
      border: '217 33% 22%',
      brand: '217 91% 60%',
      brandFg: '0 0% 100%',
      accent: '24 95% 55%',
      accentFg: '0 0% 100%',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    dark: false,
    radius: '1rem',
    colors: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '220 20% 97%',
      mutedFg: '215 16% 40%',
      border: '220 20% 90%',
      brand: '256 78% 57%',
      brandFg: '0 0% 100%',
      accent: '168 84% 40%',
      accentFg: '0 0% 100%',
    },
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    dark: true,
    radius: '0.5rem',
    font: SERIF,
    colors: {
      background: '30 12% 8%',
      foreground: '40 30% 92%',
      muted: '30 10% 15%',
      mutedFg: '38 15% 65%',
      border: '36 20% 24%',
      brand: '43 74% 52%',
      brandFg: '30 20% 10%',
      accent: '43 74% 52%',
      accentFg: '30 20% 10%',
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    dark: false,
    radius: '0.375rem',
    colors: {
      background: '0 0% 100%',
      foreground: '215 30% 17%',
      muted: '210 30% 96%',
      mutedFg: '215 16% 42%',
      border: '214 25% 88%',
      brand: '211 90% 34%',
      brandFg: '0 0% 100%',
      accent: '199 89% 42%',
      accentFg: '0 0% 100%',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    dark: false,
    radius: '0.25rem',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 10%',
      muted: '0 0% 96%',
      mutedFg: '0 0% 40%',
      border: '0 0% 89%',
      brand: '0 0% 12%',
      brandFg: '0 0% 100%',
      accent: '0 0% 12%',
      accentFg: '0 0% 100%',
    },
  },
  'blue-collar': {
    id: 'blue-collar',
    name: 'Blue Collar',
    dark: false,
    radius: '0.5rem',
    colors: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      muted: '210 20% 95%',
      mutedFg: '215 16% 38%',
      border: '214 20% 87%',
      brand: '214 84% 40%',
      brandFg: '0 0% 100%',
      accent: '38 95% 50%',
      accentFg: '222 47% 11%',
    },
  },
  medical: {
    id: 'medical',
    name: 'Medical',
    dark: false,
    radius: '0.75rem',
    colors: {
      background: '0 0% 100%',
      foreground: '200 30% 15%',
      muted: '190 40% 96%',
      mutedFg: '200 15% 40%',
      border: '190 30% 88%',
      brand: '184 65% 38%',
      brandFg: '0 0% 100%',
      accent: '160 60% 42%',
      accentFg: '0 0% 100%',
    },
  },
};

export const DEFAULT_FONT = HUMANIST;

export function getTheme(id: ThemeId): ThemeTokens {
  return themes[id] ?? themes.light;
}

export function listThemes(): ThemeTokens[] {
  return Object.values(themes);
}
