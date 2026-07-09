import { NextResponse } from 'next/server';
import { business } from '@/data/business';
import { getAIConfig } from '@/lib/ai/config';
import { PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import { businessConfigHash } from '@/lib/ai/hash';
import { cacheSnapshot, allContexts } from '@/lib/ai/generation';
import { enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/** Overall AI engine status: provider, versions, and cache coverage. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'ai-read', LIMITS.aiRead());
  if (limited) return limited;

  const config = getAIConfig();
  const snapshot = await cacheSnapshot();
  const totalPages = allContexts(business).length;

  const byType: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  for (const e of snapshot) {
    byType[e.pageType] = (byType[e.pageType] ?? 0) + 1;
    byProvider[e.provider] = (byProvider[e.provider] ?? 0) + 1;
  }

  return NextResponse.json({
    provider: config.provider,
    enabled: config.enabled,
    model: config.model ?? '(provider default)',
    promptVersion: PROMPT_LIBRARY_VERSION,
    businessVersion: businessConfigHash(business),
    cache: {
      cachedPages: snapshot.length,
      totalPages,
      coverage:
        totalPages > 0
          ? `${Math.round((snapshot.length / totalPages) * 100)}%`
          : '0%',
      byType,
      byProvider,
    },
  });
}
