import { NextResponse } from 'next/server';
import { z } from 'zod';
import { business } from '@/data/business';
import { generatePageContent } from '@/lib/ai/services/content-service';
import { getAIConfig } from '@/lib/ai/config';
import {
  buildAboutContext,
  buildCityContext,
  buildCountyContext,
  buildHomeContext,
  buildNeighborhoodContext,
  buildServiceCityContext,
  buildServiceContext,
  buildStateContext,
  buildZipContext,
} from '@/lib/ai/context';
import type { PageContext } from '@/lib/ai/types';
import { enforceRateLimit, requireAdmin, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/**
 * AI content generation endpoint.
 *
 * POST { pageType, params?, regenerate? } → generates (or regenerates) the
 * content for ONE page, using the configured provider with the deterministic
 * fallback. Set `regenerate: true` to bypass the cache for that page only.
 */
const bodySchema = z.object({
  pageType: z.enum([
    'home',
    'about',
    'service',
    'city',
    'state',
    'county',
    'neighborhood',
    'zip',
    'serviceCity',
  ]),
  params: z.record(z.string(), z.string()).optional(),
  regenerate: z.boolean().optional(),
});

function resolveContext(
  pageType: string,
  params: Record<string, string> = {},
): PageContext | undefined {
  switch (pageType) {
    case 'home':
      return buildHomeContext(business);
    case 'about':
      return buildAboutContext(business);
    case 'service':
      return buildServiceContext(business, params.serviceSlug ?? '');
    case 'state':
      return buildStateContext(business, params.stateSlug ?? '');
    case 'city':
      return buildCityContext(business, params.stateSlug ?? '', params.citySlug ?? '');
    case 'county':
      return buildCountyContext(business, params.stateSlug ?? '', params.countySlug ?? '');
    case 'neighborhood':
      return buildNeighborhoodContext(
        business,
        params.stateSlug ?? '',
        params.citySlug ?? '',
        params.neighborhoodSlug ?? '',
      );
    case 'zip':
      return buildZipContext(business, params.zip ?? '');
    case 'serviceCity':
      return buildServiceCityContext(
        business,
        params.serviceSlug ?? '',
        params.stateSlug ?? '',
        params.citySlug ?? '',
      );
    default:
      return undefined;
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'ai-write', LIMITS.aiWrite());
  if (limited) return limited;
  const denied = requireAdmin(request);
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { pageType, params, regenerate } = parsed.data;
  const ctx = resolveContext(pageType, params);
  if (!ctx) {
    return NextResponse.json(
      { error: `Could not resolve a ${pageType} page for the given params` },
      { status: 404 },
    );
  }

  try {
    const result = await generatePageContent(ctx, { regenerate });
    return NextResponse.json({
      ok: true,
      engine: getAIConfig().provider,
      page: { pageType: ctx.pageType, path: ctx.path, title: ctx.title },
      meta: result.meta,
      content: result.content,
    });
  } catch (err) {
    return serverError('ai/generate', err);
  }
}

/** GET /api/ai/generate → reports the active engine + usage hint. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'ai-read', LIMITS.aiRead());
  if (limited) return limited;

  const config = getAIConfig();
  return NextResponse.json({
    engine: config.provider,
    enabled: config.enabled,
    hint: 'POST { pageType, params?, regenerate? } to generate page content.',
    examples: [
      { pageType: 'home' },
      { pageType: 'serviceCity', params: { serviceSlug: 'drain-cleaning', stateSlug: 'texas', citySlug: 'austin' } },
    ],
  });
}
