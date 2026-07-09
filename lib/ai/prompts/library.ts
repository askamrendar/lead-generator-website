import type { PageContext, PageType } from '@/lib/ai/types';
import type { PromptMessages, PromptTemplate } from '@/lib/ai/prompts/types';

/**
 * Prompt library.
 *
 * Central, versioned home for every prompt. Page logic never embeds prompt
 * strings — it looks up a template here. Bump PROMPT_LIBRARY_VERSION whenever a
 * template changes so the cache invalidates stale content automatically.
 */
export const PROMPT_LIBRARY_VERSION = '1.0.0';

/** Shared authorial voice + quality bar applied to every page prompt. */
const SYSTEM_ROLE = [
  'You are an expert local-service SEO copywriter and conversion strategist.',
  'You write for real homeowners: warm, clear, specific, and genuinely helpful.',
  'Follow Google Helpful Content and E-E-A-T principles: demonstrate experience,',
  'expertise, authority, and trust. Sound human and conversational — never robotic.',
  'Optimize semantically and by entity, but NEVER keyword-stuff and never invent',
  'facts, credentials, awards, or fake specifics. Vary sentence structure so no two',
  'pages read alike. Keep claims consistent with the business details provided.',
].join(' ');

/** Machine-readable contract the model must satisfy. */
const JSON_CONTRACT = `Return ONE valid JSON object (no markdown, no commentary) with these optional keys.
Omit any key you cannot write well rather than padding it.
{
  "seoTitle": string (<= 60 chars, includes the place when relevant),
  "metaDescription": string (<= 155 chars, compelling, includes a call to action),
  "heroHeading": string (punchy H1, <= 70 chars),
  "heroCopy": string (2-3 sentences under the H1),
  "intro": string (1 short paragraph, unique to this exact page),
  "benefits": string[] (4-6 concrete benefits),
  "problems": [{ "problem": string, "solution": string }] (3-4 pairs),
  "whyChooseUs": string[] (3-5 differentiators),
  "process": [{ "title": string, "description": string }] (3-4 steps),
  "emergency": { "title": string, "description": string } (only if relevant),
  "locationIntro": string (only for location pages; hyper-local, mentions the place),
  "stats": [{ "value": string, "label": string }] (up to 4; do not fabricate exact numbers),
  "faqs": [{ "question": string, "answer": string }] (3-5, answer real buyer questions),
  "cta": { "title": string, "description": string }
}`;

function brief(ctx: PageContext): string {
  const b = ctx.business;
  const lines: string[] = [
    `Business: ${b.name} (${b.category})`,
    `Tagline: ${b.tagline}`,
    `About: ${b.description}`,
    `Primary service: ${b.primaryService}`,
    `Phone: ${b.phone}`,
    `Home base: ${b.address.city}, ${b.address.stateAbbr}`,
    `Service radius: ${b.serviceRadiusMiles} miles`,
    b.yearsInBusiness ? `Years in business: ${b.yearsInBusiness}` : '',
    b.licenseNumber ? `License: ${b.licenseNumber}` : '',
    b.ratingValue
      ? `Rating: ${b.ratingValue}/5 from ${b.ratingCount ?? 'many'} reviews`
      : '',
    `Page type: ${ctx.pageType}`,
    `Primary place: ${ctx.placeName}`,
    ctx.service
      ? `Service focus: ${ctx.service.name} — ${ctx.service.shortDescription}${
          ctx.service.emergency ? ' (24/7 emergency service)' : ''
        }${ctx.service.startingPrice ? `; starts around ${ctx.service.startingPrice}` : ''}`
      : '',
    ctx.city
      ? `City: ${ctx.city.name}${ctx.city.county ? `, ${ctx.city.county}` : ''}` +
        `${ctx.city.zips.length ? `; ZIPs: ${ctx.city.zips.join(', ')}` : ''}` +
        `${ctx.city.neighborhoods.length ? `; neighborhoods: ${ctx.city.neighborhoods.join(', ')}` : ''}`
      : '',
    ctx.county
      ? `County: ${ctx.county.name}; cities: ${ctx.county.cities.map((c) => c.name).join(', ')}`
      : '',
    ctx.neighborhood
      ? `Neighborhood: ${ctx.neighborhood.name} in ${ctx.neighborhood.city.name}`
      : '',
    ctx.zip ? `ZIP code: ${ctx.zip.zip} in ${ctx.zip.city.name}` : '',
    b.keywords.length ? `Target keywords (use naturally): ${b.keywords.join(', ')}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Per-page-type task instruction. */
const TASK: Record<PageType, (ctx: PageContext) => string> = {
  home: () =>
    'Write the HOMEPAGE. Establish trust fast, summarize the full offering, and drive calls/quotes.',
  about: () =>
    'Write the ABOUT page. Tell an authentic company story that builds E-E-A-T and local trust.',
  service: (c) =>
    `Write the SERVICE page for "${c.service?.name}". Explain the service, outcomes, process, and pricing approach.`,
  city: (c) =>
    `Write the CITY page for ${c.placeName}. Be hyper-local: reference neighborhoods, ZIPs, and local context.`,
  state: (c) =>
    `Write the STATE hub for ${c.placeName}: an authoritative overview linking to cities and counties served.`,
  county: (c) =>
    `Write the COUNTY hub for ${c.placeName}. Position the business as the county-wide expert.`,
  neighborhood: (c) =>
    `Write the NEIGHBORHOOD page for ${c.placeName}. Sound like the neighbor's go-to provider.`,
  zip: (c) =>
    `Write the ZIP-CODE page for ${c.placeName}. Localize tightly to that ZIP and its city.`,
  serviceCity: (c) =>
    `Write the "${c.service?.name} in ${c.placeName}" landing page — the highest-intent page. Combine service depth with hyper-local relevance and a strong CTA.`,
};

function build(ctx: PageContext): PromptMessages {
  return {
    system: SYSTEM_ROLE,
    prompt: [
      TASK[ctx.pageType](ctx),
      '',
      'BUSINESS & PAGE CONTEXT:',
      brief(ctx),
      '',
      'Make this page unique — do not reuse phrasing you would use on other pages.',
      '',
      JSON_CONTRACT,
    ].join('\n'),
  };
}

/** The page template for a given page type. */
export function pagePromptTemplate(pageType: PageType): PromptTemplate {
  return {
    id: `page:${pageType}`,
    version: PROMPT_LIBRARY_VERSION,
    build,
  };
}

/**
 * Focused field prompts — used by single-purpose agents (meta title, hero,
 * FAQ, CTA, reviews, schema enrichment). Each returns PromptMessages.
 */
export const fieldPrompts = {
  metaTitle: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Write ONE SEO title tag (<= 60 chars) for this page. Return JSON {"seoTitle": string}.\n\n${brief(ctx)}`,
  }),
  metaDescription: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Write ONE meta description (<= 155 chars, with a call to action). Return JSON {"metaDescription": string}.\n\n${brief(ctx)}`,
  }),
  hero: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Write a hero heading and 2-3 sentence sub-copy. Return JSON {"heroHeading": string, "heroCopy": string}.\n\n${brief(ctx)}`,
  }),
  faq: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Write 4-5 genuinely useful FAQs answering real buyer questions for this page. Return JSON {"faqs": [{"question": string, "answer": string}]}.\n\n${brief(ctx)}`,
  }),
  cta: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Write a conversion CTA block. Return JSON {"cta": {"title": string, "description": string}}.\n\n${brief(ctx)}`,
  }),
  reviews: (ctx: PageContext): PromptMessages => ({
    system: `${SYSTEM_ROLE} These are ILLUSTRATIVE sample testimonials for layout — keep them realistic and clearly generic, never impersonating real named customers.`,
    prompt: `Write 3 short, believable sample reviews (rating 5). Return JSON {"reviews": [{"author": string, "rating": number, "body": string, "location": string}]}.\n\n${brief(ctx)}`,
  }),
  schemaEnrichment: (ctx: PageContext): PromptMessages => ({
    system: SYSTEM_ROLE,
    prompt: `Suggest structured-data enrichment for this page. Return JSON {"additionalKeywords": string[], "speakableSelectors": string[]}.\n\n${brief(ctx)}`,
  }),
} as const;

export type FieldPromptId = keyof typeof fieldPrompts;
