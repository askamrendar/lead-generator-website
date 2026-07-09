import type { BusinessConfig } from '@/lib/generator/schema';
import type { PromptMessages } from '@/lib/ai/prompts/types';

/**
 * Blog prompt templates (FOUNDATION ONLY).
 *
 * These power the blog *generators* (topics, outlines, keyword maps, article
 * prompts, categories, tags). The blog *pages* are intentionally NOT built in
 * this phase — see ROADMAP Phase 8.
 */

const BLOG_SYSTEM = [
  'You are a senior content strategist and SEO editor for local-service brands.',
  'You produce genuinely helpful, non-generic ideas grounded in real customer',
  'intent. Avoid fluff, avoid keyword stuffing, and prefer specificity.',
].join(' ');

function base(business: BusinessConfig): string {
  return [
    `Business: ${business.name} (${business.category})`,
    `Primary service: ${business.primaryService}`,
    `Location: ${business.address.city}, ${business.address.stateAbbr}`,
    business.keywords.length ? `Seed keywords: ${business.keywords.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function blogTopicsPrompt(
  business: BusinessConfig,
  count = 20,
  seedKeyword?: string,
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Generate ${count} blog topic ideas that a ${business.category} customer would search for${
      seedKeyword ? ` around "${seedKeyword}"` : ''
    }. Mix informational, commercial, and local intent. Return JSON {"topics": [{"title": string, "intent": "informational"|"commercial"|"local", "primaryKeyword": string}]}.\n\n${base(business)}`,
  };
}

export function blogOutlinePrompt(
  business: BusinessConfig,
  topic: string,
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Create a detailed H2/H3 outline for an article titled "${topic}". Return JSON {"outline": [{"heading": string, "level": 2|3, "notes": string}]}.\n\n${base(business)}`,
  };
}

export function keywordMapPrompt(
  business: BusinessConfig,
  topic: string,
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Build a keyword map for "${topic}": one primary keyword, several secondary and semantic/entity terms. Return JSON {"primary": string, "secondary": string[], "semantic": string[]}.\n\n${base(business)}`,
  };
}

export function articlePromptTemplate(
  business: BusinessConfig,
  input: { topic: string; outline?: string; keywords?: string[] },
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: [
      `Write a complete, original, E-E-A-T-optimized article titled "${input.topic}".`,
      input.outline ? `Follow this outline:\n${input.outline}` : '',
      input.keywords?.length
        ? `Use these keywords naturally (no stuffing): ${input.keywords.join(', ')}.`
        : '',
      'Return JSON {"title": string, "metaDescription": string, "markdown": string, "faqs": [{"question": string, "answer": string}]}.',
      '',
      base(business),
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function relatedArticlesPrompt(
  business: BusinessConfig,
  topic: string,
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Suggest 5 closely related follow-up article titles for a topic cluster around "${topic}". Return JSON {"related": string[]}.\n\n${base(business)}`,
  };
}

export function categoriesPrompt(business: BusinessConfig): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Propose 6-8 blog categories for a ${business.category} company site. Return JSON {"categories": [{"name": string, "slug": string, "description": string}]}.\n\n${base(business)}`,
  };
}

export function tagsPrompt(
  business: BusinessConfig,
  topic: string,
): PromptMessages {
  return {
    system: BLOG_SYSTEM,
    prompt: `Suggest 5-10 tags for an article about "${topic}". Return JSON {"tags": string[]}.\n\n${base(business)}`,
  };
}
