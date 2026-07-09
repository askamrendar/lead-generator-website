import { NextResponse } from 'next/server';
import { z } from 'zod';
import { business } from '@/data/business';
import { buildContext } from '@/lib/ai/context';
import { generatePageContent } from '@/lib/ai/services/content-service';
import { archiveCurrent } from '@/lib/ai/versioning';
import { contentKey } from '@/lib/ai/cache';
import { PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import { enforceRateLimit, requireAdmin, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/**
 * Regenerate ONE page: archives the current version (for rollback), then forces
 * a fresh generation bypassing the cache.
 */
const schema = z.object({
  pageType: z.string(),
  params: z.record(z.string(), z.string()).optional(),
});

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
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const ctx = buildContext(business, parsed.data.pageType, parsed.data.params);
  if (!ctx) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    await archiveCurrent(contentKey(ctx, PROMPT_LIBRARY_VERSION));
    const result = await generatePageContent(ctx, { regenerate: true });

    return NextResponse.json({
      ok: true,
      page: { pageType: ctx.pageType, path: ctx.path },
      meta: result.meta,
      content: result.content,
    });
  } catch (err) {
    return serverError('ai/regenerate', err);
  }
}
