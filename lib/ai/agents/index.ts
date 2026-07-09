import {
  generatePageContent,
  type GenerateOptions,
} from '@/lib/ai/services/content-service';
import { buildImagePrompts } from '@/lib/ai/services/image-prompts';
import { generateBlogTopics } from '@/lib/ai/services/blog';
import type {
  CtaBlock,
  Faq,
  GeneratedReview,
  GenerationResult,
  ImagePrompt,
  LinkAnchor,
  PageContext,
  PageType,
} from '@/lib/ai/types';

/**
 * AI agents.
 *
 * Reusable, single-responsibility units. **Page agents** produce a full page's
 * content (cached, provider-backed, deterministic fallback). **Field agents**
 * derive one section from that same generation so a page stays internally
 * consistent. **Utility agents** (image prompts, schema, blog) are pure or wrap
 * their service. Every agent is provider-agnostic.
 */

function makePageAgent(expected: PageType) {
  return (ctx: PageContext, opts?: GenerateOptions): Promise<GenerationResult> => {
    if (ctx.pageType !== expected) {
      throw new Error(
        `Agent for "${expected}" received context "${ctx.pageType}"`,
      );
    }
    return generatePageContent(ctx, opts);
  };
}

// --- Page agents -------------------------------------------------------------
export const homepageAgent = makePageAgent('home');
export const aboutPageAgent = makePageAgent('about');
export const servicePageAgent = makePageAgent('service');
export const locationPageAgent = makePageAgent('city');
export const statePageAgent = makePageAgent('state');
export const countyPageAgent = makePageAgent('county');
export const neighborhoodPageAgent = makePageAgent('neighborhood');
export const zipPageAgent = makePageAgent('zip');
export const serviceCityPageAgent = makePageAgent('serviceCity');

/** Generic page agent that dispatches on the context's own pageType. */
export const pageAgent = (
  ctx: PageContext,
  opts?: GenerateOptions,
): Promise<GenerationResult> => generatePageContent(ctx, opts);

// --- Field agents (derived from the page generation) -------------------------
export async function metaTitleAgent(ctx: PageContext): Promise<string> {
  return (await generatePageContent(ctx)).content.seoTitle;
}
export async function metaDescriptionAgent(ctx: PageContext): Promise<string> {
  return (await generatePageContent(ctx)).content.metaDescription;
}
export async function heroAgent(
  ctx: PageContext,
): Promise<{ heroHeading: string; heroCopy: string }> {
  const c = (await generatePageContent(ctx)).content;
  return { heroHeading: c.heroHeading, heroCopy: c.heroCopy };
}
export async function faqAgent(ctx: PageContext): Promise<Faq[]> {
  return (await generatePageContent(ctx)).content.faqs;
}
export async function ctaAgent(ctx: PageContext): Promise<CtaBlock> {
  return (await generatePageContent(ctx)).content.cta;
}
export async function reviewAgent(ctx: PageContext): Promise<GeneratedReview[]> {
  return (await generatePageContent(ctx)).content.reviews;
}
export async function internalLinkAgent(
  ctx: PageContext,
): Promise<LinkAnchor[]> {
  return (await generatePageContent(ctx)).content.internalLinks;
}

// --- Utility agents ----------------------------------------------------------
export function imagePromptAgent(ctx: PageContext): ImagePrompt[] {
  return buildImagePrompts(ctx);
}

export function schemaEnrichmentAgent(ctx: PageContext): {
  additionalKeywords: string[];
  speakableSelectors: string[];
} {
  const base = ctx.business.keywords.slice(0, 6);
  const local =
    ctx.placeName && !base.includes(ctx.placeName)
      ? [ctx.placeName.toLowerCase()]
      : [];
  return {
    additionalKeywords: [...base, ...local],
    speakableSelectors: ['h1', '.speakable-intro'],
  };
}

export async function blogTopicAgent(
  ctx: PageContext,
  count = 20,
): Promise<Awaited<ReturnType<typeof generateBlogTopics>>> {
  return generateBlogTopics(ctx.business, count);
}

/** Registry for programmatic lookup (e.g. from an admin/job runner). */
export const agents = {
  home: homepageAgent,
  about: aboutPageAgent,
  service: servicePageAgent,
  city: locationPageAgent,
  state: statePageAgent,
  county: countyPageAgent,
  neighborhood: neighborhoodPageAgent,
  zip: zipPageAgent,
  serviceCity: serviceCityPageAgent,
} satisfies Record<PageType, ReturnType<typeof makePageAgent>>;
