/**
 * Pure SEO helpers for the Blog Generator — word count, reading time, excerpt, and a
 * metadata builder. No I/O, so unit-testable (tests/blog-seo.test.mjs). Rendering +
 * JSON-LD emission live in the SEO engine / `components/seo`; this only prepares data.
 */

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  ogTitle: string;
  ogDescription: string;
  twitterCard: 'summary_large_image';
}

/** Strip basic markdown to plain text. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text: string): number {
  const plain = stripMarkdown(text);
  return plain ? plain.split(/\s+/).length : 0;
}

/** ~200 wpm, minimum 1 minute. */
export function readingTimeMin(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function makeExcerpt(body: string, max = 160): string {
  const plain = stripMarkdown(body);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`;
}

export function buildSeo(title: string, excerpt: string, canonical?: string): SeoMeta {
  const description = excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt;
  return {
    title: title.length > 60 ? `${title.slice(0, 57)}…` : title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    twitterCard: 'summary_large_image',
  };
}
