import { slugify } from '@/lib/utils';
import { getServices } from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';
import { getAIConfig } from '@/lib/ai/config';
import { getProvider } from '@/lib/ai/providers';
import { withRetry } from '@/lib/ai/services/retry';
import { providerLimiter } from '@/lib/ai/services/rate-limit';
import type { PromptMessages } from '@/lib/ai/prompts/types';
import {
  articlePromptTemplate,
  blogOutlinePrompt,
  blogTopicsPrompt,
  categoriesPrompt,
  keywordMapPrompt,
  relatedArticlesPrompt,
  tagsPrompt,
} from '@/lib/ai/prompts/blog';

/**
 * Blog Engine — FOUNDATION ONLY.
 *
 * Generators for topics, outlines, keyword maps, article prompts, related
 * articles, categories, and tags. Each uses the active AI provider when
 * configured and falls back to a deterministic default so it works offline.
 * Blog *pages* are deferred to Phase 8.
 */

export interface BlogTopic {
  title: string;
  intent: 'informational' | 'commercial' | 'local';
  primaryKeyword: string;
}
export interface OutlineItem {
  heading: string;
  level: 2 | 3;
  notes?: string;
}
export interface KeywordMap {
  primary: string;
  secondary: string[];
  semantic: string[];
}
export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
}

function safeJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    return {};
  }
}

async function runJSON(messages: PromptMessages): Promise<Record<string, unknown>> {
  const config = getAIConfig();
  const provider = getProvider();
  if (!config.enabled || !provider.isConfigured()) return {};
  try {
    const res = await withRetry(() =>
      providerLimiter.run(() =>
        provider.complete({
          system: messages.system,
          prompt: messages.prompt,
          json: true,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        }),
      ),
    );
    return safeJSON(res.text);
  } catch {
    return {};
  }
}

// --- Generators --------------------------------------------------------------

export async function generateBlogTopics(
  business: BusinessConfig,
  count = 20,
  seedKeyword?: string,
): Promise<BlogTopic[]> {
  const ai = await runJSON(blogTopicsPrompt(business, count, seedKeyword));
  if (Array.isArray(ai.topics) && ai.topics.length) {
    return (ai.topics as BlogTopic[]).slice(0, count);
  }
  // Deterministic fallback: derive topics from services + location.
  const city = business.address.city;
  const cat = business.category;
  const templates: Array<(s: string) => BlogTopic> = [
    (s) => ({ title: `How Much Does ${s} Cost in ${city}?`, intent: 'commercial', primaryKeyword: `${s.toLowerCase()} cost ${city.toLowerCase()}` }),
    (s) => ({ title: `Signs You Need ${s} (And What to Do)`, intent: 'informational', primaryKeyword: `signs you need ${s.toLowerCase()}` }),
    (s) => ({ title: `${s} in ${city}: What to Expect`, intent: 'local', primaryKeyword: `${s.toLowerCase()} ${city.toLowerCase()}` }),
    (s) => ({ title: `DIY vs Professional ${s}: When to Call an Expert`, intent: 'informational', primaryKeyword: `diy ${s.toLowerCase()}` }),
  ];
  const topics: BlogTopic[] = [];
  for (const s of getServices(business)) {
    for (const t of templates) {
      if (topics.length >= count) break;
      topics.push(t(s.name));
    }
  }
  topics.push({
    title: `A Homeowner's Guide to Choosing a ${cat} Company in ${city}`,
    intent: 'commercial',
    primaryKeyword: `best ${cat.toLowerCase()} ${city.toLowerCase()}`,
  });
  return topics.slice(0, count);
}

export async function generateBlogOutline(
  business: BusinessConfig,
  topic: string,
): Promise<OutlineItem[]> {
  const ai = await runJSON(blogOutlinePrompt(business, topic));
  if (Array.isArray(ai.outline) && ai.outline.length) {
    return ai.outline as OutlineItem[];
  }
  return [
    { heading: 'Introduction', level: 2, notes: 'Hook + what the reader will learn' },
    { heading: `What Is ${topic}?`, level: 2 },
    { heading: 'Key Factors to Consider', level: 2 },
    { heading: 'Common Mistakes to Avoid', level: 3 },
    { heading: 'When to Call a Professional', level: 2 },
    { heading: 'FAQs', level: 2 },
    { heading: 'Conclusion & Next Steps', level: 2 },
  ];
}

export async function generateKeywordMap(
  business: BusinessConfig,
  topic: string,
): Promise<KeywordMap> {
  const ai = await runJSON(keywordMapPrompt(business, topic));
  if (typeof ai.primary === 'string') {
    return {
      primary: ai.primary,
      secondary: Array.isArray(ai.secondary) ? (ai.secondary as string[]) : [],
      semantic: Array.isArray(ai.semantic) ? (ai.semantic as string[]) : [],
    };
  }
  const kw = topic.toLowerCase();
  return {
    primary: kw,
    secondary: [`${kw} cost`, `${kw} near me`, `best ${kw}`],
    semantic: [business.category.toLowerCase(), business.address.city.toLowerCase()],
  };
}

/** Build (not run) the full article-writing prompt for a topic. */
export function buildArticlePrompt(
  business: BusinessConfig,
  input: { topic: string; outline?: string; keywords?: string[] },
): PromptMessages {
  return articlePromptTemplate(business, input);
}

export async function generateRelatedArticles(
  business: BusinessConfig,
  topic: string,
): Promise<string[]> {
  const ai = await runJSON(relatedArticlesPrompt(business, topic));
  if (Array.isArray(ai.related) && ai.related.length) {
    return ai.related as string[];
  }
  return [
    `${topic}: A Complete Checklist`,
    `Top Questions About ${topic}`,
    `How to Prepare for ${topic}`,
    `${topic} vs Alternatives`,
    `Maintenance Tips After ${topic}`,
  ];
}

export async function generateBlogCategories(
  business: BusinessConfig,
): Promise<BlogCategory[]> {
  const ai = await runJSON(categoriesPrompt(business));
  if (Array.isArray(ai.categories) && ai.categories.length) {
    return (ai.categories as BlogCategory[]).map((c) => ({
      ...c,
      slug: c.slug || slugify(c.name),
    }));
  }
  const base = [
    'Tips & Advice',
    'Cost Guides',
    'How-To',
    'Maintenance',
    'Emergency Help',
    `${business.category} 101`,
  ];
  return base.map((name) => ({
    name,
    slug: slugify(name),
    description: `${name} for ${business.category.toLowerCase()} customers.`,
  }));
}

export async function generateBlogTags(
  business: BusinessConfig,
  topic: string,
): Promise<string[]> {
  const ai = await runJSON(tagsPrompt(business, topic));
  if (Array.isArray(ai.tags) && ai.tags.length) return ai.tags as string[];
  return [
    business.category.toLowerCase(),
    business.address.city.toLowerCase(),
    ...topic.toLowerCase().split(' ').filter((w) => w.length > 4).slice(0, 4),
  ];
}
