import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, de-duplicating Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL/DOM-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['".]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deterministic 32-bit hash (FNV-1a). Same input → same number, always.
 * Used by the content engine to vary copy per page without randomness,
 * so builds are reproducible and pages are not byte-identical.
 */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministically pick one item from `options`, seeded by `seed`. */
export function pick<T>(options: readonly T[], seed: string): T {
  if (options.length === 0) throw new Error('pick(): empty options');
  return options[hashString(seed) % options.length];
}

/** Format a US phone number for display, e.g. "(555) 123-4567". */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^1/, '');
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Strip a phone number to the `tel:` href form. */
export function telHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+]/g, '')}`;
}
