import { NextResponse } from 'next/server';
import { business } from '@/data/business';
import { pagePromptTemplate, PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import { buildHomeContext } from '@/lib/ai/context';
import type { PageType } from '@/lib/ai/types';
import { enforceRateLimit, requireAdmin } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

const PAGE_TYPES: PageType[] = [
  'home',
  'about',
  'service',
  'state',
  'city',
  'county',
  'neighborhood',
  'zip',
  'serviceCity',
];

/**
 * Prompt library viewer. Lists the versioned page templates and returns a
 * sample built prompt (home) so you can inspect what the model receives.
 */
export async function GET(request: Request) {
  // Admin-gated (fail-closed): exposes internal prompt templates.
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limited = enforceRateLimit(request, 'ai-read', LIMITS.aiRead());
  if (limited) return limited;

  const sample = pagePromptTemplate('home').build(buildHomeContext(business));
  return NextResponse.json({
    version: PROMPT_LIBRARY_VERSION,
    pageTemplates: PAGE_TYPES.map((t) => ({ id: `page:${t}`, pageType: t })),
    fieldTemplates: [
      'metaTitle',
      'metaDescription',
      'hero',
      'faq',
      'cta',
      'reviews',
      'schemaEnrichment',
    ],
    sample: {
      pageType: 'home',
      system: sample.system,
      prompt: sample.prompt.slice(0, 600) + '…',
    },
  });
}
