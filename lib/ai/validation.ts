import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * Content validation + auto-repair.
 *
 * `validateContent` reports quality issues; `repairContent` guarantees a
 * complete, non-empty, non-duplicate content object by filling any missing or
 * invalid field from the deterministic fallback. Render always repairs, so a
 * page can never show a missing heading, CTA, FAQ, or metadata.
 */

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

const nonEmpty = (s: unknown): s is string =>
  typeof s === 'string' && s.trim().length > 0;

export function validateContent(
  content: Partial<GeneratedPageContent> | undefined,
): ValidationResult {
  const issues: string[] = [];
  if (!content) return { ok: false, issues: ['content missing'] };

  if (!nonEmpty(content.seoTitle)) issues.push('missing seoTitle');
  if (!nonEmpty(content.metaDescription)) issues.push('missing metaDescription');
  else if (content.metaDescription.length > 170)
    issues.push('metaDescription too long');
  if (!nonEmpty(content.heroHeading)) issues.push('missing heroHeading');
  if (!nonEmpty(content.intro)) issues.push('missing intro');
  if (!content.benefits?.length) issues.push('missing benefits');
  if (!content.faqs?.length) issues.push('missing faqs');
  if (!content.process?.length) issues.push('missing process');
  if (!content.stats?.length) issues.push('missing stats');
  if (!nonEmpty(content.cta?.title) || !nonEmpty(content.cta?.description))
    issues.push('missing/invalid cta');

  // Duplicate-paragraph guard.
  if (
    nonEmpty(content.intro) &&
    nonEmpty(content.heroCopy) &&
    content.intro.trim() === content.heroCopy.trim()
  ) {
    issues.push('intro duplicates heroCopy');
  }

  return { ok: issues.length === 0, issues };
}

function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const k = s.trim().toLowerCase();
    if (!nonEmpty(s) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Merge a (possibly partial/invalid) content object over the deterministic
 * fallback so every required field is present, valid, and de-duplicated.
 */
export function repairContent(
  content: Partial<GeneratedPageContent> | undefined,
  fallback: GeneratedPageContent,
): GeneratedPageContent {
  const c = content ?? {};

  const pickStr = (v: unknown, fb: string): string =>
    nonEmpty(v) ? (v as string).trim() : fb;

  const benefits = dedupeStrings(
    (Array.isArray(c.benefits) && c.benefits.length
      ? c.benefits
      : fallback.benefits) as string[],
  );
  const whyChooseUs = dedupeStrings(
    (Array.isArray(c.whyChooseUs) && c.whyChooseUs.length
      ? c.whyChooseUs
      : fallback.whyChooseUs) as string[],
  );

  let heroCopy = pickStr(c.heroCopy, fallback.heroCopy);
  const intro = pickStr(c.intro, fallback.intro);
  // Break intro/heroCopy duplication.
  if (heroCopy.trim() === intro.trim()) heroCopy = fallback.heroCopy;

  const metaDescription = pickStr(
    c.metaDescription,
    fallback.metaDescription,
  ).slice(0, 170);

  return {
    seoTitle: pickStr(c.seoTitle, fallback.seoTitle),
    metaDescription,
    heroHeading: pickStr(c.heroHeading, fallback.heroHeading),
    heroCopy,
    intro,
    benefits: benefits.length ? benefits : fallback.benefits,
    problems: c.problems?.length ? c.problems : fallback.problems,
    whyChooseUs: whyChooseUs.length ? whyChooseUs : fallback.whyChooseUs,
    process: c.process?.length ? c.process : fallback.process,
    emergency: c.emergency ?? fallback.emergency,
    locationIntro: nonEmpty(c.locationIntro)
      ? c.locationIntro
      : fallback.locationIntro,
    stats: c.stats?.length ? c.stats : fallback.stats,
    reviews: c.reviews?.length ? c.reviews : fallback.reviews,
    faqs: c.faqs?.length ? c.faqs : fallback.faqs,
    relatedServices: c.relatedServices?.length
      ? c.relatedServices
      : fallback.relatedServices,
    relatedLocations: c.relatedLocations?.length
      ? c.relatedLocations
      : fallback.relatedLocations,
    cta:
      nonEmpty(c.cta?.title) && nonEmpty(c.cta?.description)
        ? c.cta!
        : fallback.cta,
    imagePrompts: c.imagePrompts?.length
      ? c.imagePrompts
      : fallback.imagePrompts,
    internalLinks: c.internalLinks?.length
      ? c.internalLinks
      : fallback.internalLinks,
  };
}
