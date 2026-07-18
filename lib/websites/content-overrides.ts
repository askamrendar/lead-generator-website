import { z } from 'zod';
import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * Site Editor content overrides — PURE (zod only), unit-testable.
 *
 * A website's `contentOverrides` JSON maps site-relative page paths ("/",
 * "/services/<slug>", "/near-me/<slug>", …) to a partial page-content patch.
 * At render time the platform merges the patch over the AI/deterministic
 * `GeneratedPageContent` for that page — pages stay DERIVED (no stored HTML,
 * no duplicated pages), so template switching and regeneration keep working.
 *
 * Only user-facing copy fields are editable; structural/engine fields
 * (internalLinks, imagePrompts, relatedServices…) remain platform-owned.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const pageOverrideSchema = z
  .object({
    seoTitle: trimmed(120).optional(),
    metaDescription: trimmed(320).optional(),
    heroHeading: trimmed(160).optional(),
    heroCopy: trimmed(500).optional(),
    intro: trimmed(4000).optional(),
    benefits: z.array(trimmed(300)).max(20).optional(),
    whyChooseUs: z.array(trimmed(300)).max(20).optional(),
    process: z
      .array(z.object({ title: trimmed(160), description: trimmed(600) }))
      .max(12)
      .optional(),
    faqs: z
      .array(z.object({ question: trimmed(300), answer: trimmed(1200) }))
      .max(20)
      .optional(),
    cta: z.object({ title: trimmed(160), description: trimmed(500) }).optional(),
  })
  .strict();

export type PageOverride = z.infer<typeof pageOverrideSchema>;

/** Map of site-relative path → partial content patch. */
export const contentOverridesSchema = z.record(z.string(), pageOverrideSchema);
export type ContentOverrides = z.infer<typeof contentOverridesSchema>;

/** Parse a stored JSON blob defensively — invalid/missing input → no overrides. */
export function parseContentOverrides(raw: unknown): ContentOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const parsed = contentOverridesSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

/** Empty-string / empty-array patch values mean "no override" for that field. */
function meaningful<T>(value: T): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null;
}

/**
 * Merge a page's override patch over generated content. Pure; returns the
 * original object when there is nothing to apply.
 */
export function applyPageOverride(
  content: GeneratedPageContent,
  override: PageOverride | undefined,
): GeneratedPageContent {
  if (!override) return content;
  const patch: Partial<GeneratedPageContent> = {};
  for (const [key, value] of Object.entries(override)) {
    if (meaningful(value)) (patch as Record<string, unknown>)[key] = value;
  }
  if (Object.keys(patch).length === 0) return content;
  return { ...content, ...patch };
}
