import type { ContentType } from '@/lib/blog/content-types';
import { makeExcerpt } from '@/lib/blog/seo';

/**
 * Deterministic content generation — produces a coherent Markdown baseline from the
 * business config + content type. This mirrors the app's offline-safe pattern: a
 * provider-agnostic AI Engine (`lib/ai`) upgrades the copy when a key is configured;
 * with none, this deterministic baseline is used. No page rendering here — the SEO
 * engine / builder render the stored content.
 */
export interface GenerateInput {
  businessName: string;
  category?: string;
  primaryService?: string;
  services?: string[];
  city?: string;
  state?: string;
  type: ContentType;
  topic?: string;
}

export interface GeneratedContent {
  title: string;
  body: string;
  excerpt: string;
  tags: string[];
}

function place(input: GenerateInput): string {
  return [input.city, input.state].filter(Boolean).join(', ');
}

function title(input: GenerateInput): string {
  const svc = input.primaryService || input.category || 'Services';
  const loc = place(input);
  const biz = input.businessName;
  switch (input.type) {
    case 'SERVICE': return `${svc} by ${biz}`;
    case 'CITY': return `${svc} in ${input.city || loc}`;
    case 'AREA': return `${svc} Across ${input.state || loc}`;
    case 'NEIGHBORHOOD': return `Local ${svc} — ${input.city || loc}`;
    case 'LOCATION': return `${biz} — ${loc || 'Your Local Team'}`;
    case 'FAQ': return `${svc}: Frequently Asked Questions`;
    case 'COMPARISON': return `Choosing ${svc}: What to Compare`;
    case 'EDUCATIONAL': return input.topic || `A Guide to ${svc}`;
    case 'RESOURCE': return `The Complete ${svc} Resource Guide`;
    case 'CASE_STUDY': return `Case Study: ${svc} for a ${loc || 'Local'} Client`;
    case 'PRESS_RELEASE': return `${biz} Announces Expanded ${svc}`;
    case 'LANDING': return `Get ${svc} Today — ${biz}`;
    case 'SUPPORTING': return `Understanding ${svc}`;
    case 'ARTICLE':
    default: return input.topic || `${svc}: What You Need to Know`;
  }
}

export function generateContent(input: GenerateInput): GeneratedContent {
  const t = title(input);
  const biz = input.businessName;
  const svc = input.primaryService || input.category || 'services';
  const loc = place(input);
  const services = (input.services ?? []).filter(Boolean);

  const sections: string[] = [
    `# ${t}`,
    `${biz} provides professional ${svc}${loc ? ` in ${loc}` : ''}. This page helps you understand ${input.type === 'FAQ' ? 'the common questions' : `what to expect and why ${biz} is the right choice`}.`,
    `## Why ${svc} matters`,
    `Choosing the right provider for ${svc} affects quality, cost, and peace of mind. ${biz} focuses on reliable, transparent service${loc ? ` for ${loc} customers` : ''}.`,
  ];

  if (services.length > 0) {
    sections.push('## What we offer', services.map((s) => `- ${s}`).join('\n'));
  }

  if (input.type === 'FAQ') {
    sections.push(
      '## Frequently asked questions',
      `**How soon can you help?** ${biz} responds quickly and offers scheduling that works for you.`,
      `**Do you serve ${input.city || 'my area'}?** Yes — ${biz} serves ${loc || 'the local area'} and nearby communities.`,
      `**How much does ${svc} cost?** Pricing depends on scope; contact ${biz} for a clear, upfront quote.`,
    );
  } else if (input.type === 'COMPARISON') {
    sections.push(
      '## What to compare',
      `- **Experience & reviews** — proven local results.\n- **Transparency** — clear pricing, no surprises.\n- **Responsiveness** — quick answers when you need them.`,
    );
  } else {
    sections.push(
      '## Our approach',
      `${biz} combines local expertise with dependable service. From the first call to the finished job, we keep you informed.`,
    );
  }

  sections.push(
    '## Get started',
    `Ready for ${svc}${loc ? ` in ${loc}` : ''}? Contact ${biz} today for a free, no-obligation consultation.`,
  );

  const body = sections.join('\n\n');
  const tags = [svc, input.category, input.city, input.type.toLowerCase()].filter(Boolean) as string[];
  return { title: t, body, excerpt: makeExcerpt(body), tags };
}
