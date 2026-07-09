import { NextResponse } from 'next/server';
import { getCacheStore } from '@/lib/ai/cache';
import { cacheSnapshot } from '@/lib/ai/generation';
import { listVersions, rollback } from '@/lib/ai/versioning';
import {
  enforceRateLimit,
  requireAdmin,
  serverError,
} from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/** GET /api/ai/cache            → list all cached entries (content registry) */
/** GET /api/ai/cache?key=...    → include the version history for one key    */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'ai-read', LIMITS.aiRead());
  if (limited) return limited;
  // Admin-gated: this returns the full content registry (page copy, provider,
  // model, businessVersion). Consistent with the DELETE/POST handlers below.
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const key = new URL(request.url).searchParams.get('key');
    if (key) {
      const store = getCacheStore();
      const entry = await store.get(key);
      const history = await listVersions(key);
      return NextResponse.json({ key, entry, history });
    }
    return NextResponse.json({ entries: await cacheSnapshot() });
  } catch (err) {
    return serverError('ai/cache:GET', err);
  }
}

/** DELETE /api/ai/cache         → clear the entire cache                     */
/** DELETE /api/ai/cache?key=... → delete a single entry                      */
export async function DELETE(request: Request) {
  const limited = enforceRateLimit(request, 'ai-write', LIMITS.aiWrite());
  if (limited) return limited;
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const store = getCacheStore();
    const key = new URL(request.url).searchParams.get('key');
    if (key) {
      const deleted = await store.delete(key);
      return NextResponse.json({ ok: true, deleted, key });
    }
    const keys = await store.keys();
    await Promise.all(keys.map((k) => store.delete(k)));
    return NextResponse.json({ ok: true, cleared: keys.length });
  } catch (err) {
    return serverError('ai/cache:DELETE', err);
  }
}

/** POST /api/ai/cache { key, action: "rollback" } → roll a page back a version */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'ai-write', LIMITS.aiWrite());
  if (limited) return limited;
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: { key?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body.action === 'rollback' && body.key) {
    try {
      const restored = await rollback(body.key);
      if (!restored) {
        return NextResponse.json(
          { ok: false, error: 'No previous version to roll back to' },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, restored: { key: restored.key, createdAt: restored.createdAt } });
    } catch (err) {
      return serverError('ai/cache:POST', err);
    }
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
