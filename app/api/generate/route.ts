import { NextResponse } from 'next/server';
import { safeParseBusinessConfig } from '@/lib/generator/schema';
import { getAllPaths } from '@/lib/generator/config';
import { enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/**
 * Generator endpoint. Accepts a candidate BusinessConfig, validates it against
 * the schema, and returns the normalized config plus the routes that would be
 * generated for it. This is the API the /generate intake form posts to and the
 * seam a future dashboard uses to persist + build a real site.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'generate', LIMITS.generate());
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = safeParseBusinessConfig(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const config = parsed.data;
  const routes = getAllPaths(config);

  return NextResponse.json({
    ok: true,
    config,
    stats: {
      services: config.services.length,
      cities: config.states.reduce((n, s) => n + s.cities.length, 0),
      totalPages: routes.length,
    },
    routes,
  });
}
