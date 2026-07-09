import { NextResponse } from 'next/server';
import { z } from 'zod';
import { business } from '@/data/business';
import { generateWebsite, type GenerationScope } from '@/lib/ai/generation';
import { enforceRateLimit, requireAdmin, serverError } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';
// Batch generation can be long-running; allow up to 5 minutes.
export const maxDuration = 300;

/**
 * Batch (pre-)generation. POST { scope, regenerate?, limit? } to populate the
 * cache for an entire scope. With no provider configured this writes the
 * deterministic baseline (a warm cache); with a provider it writes AI content.
 */
const schema = z.object({
  scope: z
    .enum([
      'website',
      'core',
      'services',
      'cities',
      'states',
      'counties',
      'zips',
      'neighborhoods',
      'matrix',
    ])
    .default('website'),
  regenerate: z.boolean().optional(),
  limit: z.number().int().positive().max(2000).optional(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'ai-write', LIMITS.aiWrite());
  if (limited) return limited;
  const denied = requireAdmin(request);
  if (denied) return denied;

  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    // empty body → defaults
  }
  const parsed = schema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { scope, regenerate, limit } = parsed.data;
  try {
    const summary = await generateWebsite(business, scope as GenerationScope, {
      regenerate,
      limit,
    });
    return NextResponse.json({ ok: true, scope, summary });
  } catch (err) {
    return serverError('ai/batch', err);
  }
}
