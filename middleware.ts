import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';

/**
 * Next.js middleware entry point. Two responsibilities:
 *
 * 1. CUSTOM-DOMAIN HOSTING: a request whose Host header is not one of the app's own
 *    hosts is a tenant website on a connected domain — rewrite it to the internal
 *    `/hosted/<host>/<path>` surface. Edge-safe: no DB access here; the hosted route
 *    resolves domain → website (and fails closed) in the Node runtime.
 *
 * 2. AUTH GUARD: on the app's own host, delegate /dashboard + /app to the Edge-safe
 *    Auth.js guard exactly as before.
 *
 * NOTE: `config.matcher` must be a statically-analyzable literal (Next inlines it
 * at build time), so it is declared here rather than imported.
 */

function isAppHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.AUTH_URL]) {
    if (!raw) continue;
    try {
      if (new URL(raw).hostname.toLowerCase() === host) return true;
    } catch {
      /* ignore malformed env */
    }
  }
  // Platform-injected deployment hosts serve the app itself.
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.toLowerCase();
  if (railway && host === railway) return true;
  const vercel = process.env.VERCEL_URL?.toLowerCase().split('/')[0];
  if (vercel && host === vercel) return true;
  return host.endsWith('.up.railway.app') || host.endsWith('.vercel.app');
}

export default function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase();

  if (host && !isAppHost(host)) {
    const url = req.nextUrl.clone();
    url.pathname = `/hosted/${host}${req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (/^\/(dashboard|app)(\/|$)/.test(req.nextUrl.pathname)) {
    return (authMiddleware as unknown as (r: NextRequest) => Response)(req);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets, API routes (APIs must never
  // be host-rewritten: exported/hosted sites post leads to the app API directly),
  // and template-pack assets (custom-domain pages load css/js/images from
  // /templates/<pack>/assets — rewriting them into /hosted would 404).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|templates/).*)'],
};
