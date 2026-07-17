import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { loadSiteBundle, renderHtmlPage } from '@/lib/websites/render-service';
import { resolveSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';

/**
 * Custom-domain hosting surface. Middleware rewrites foreign Host headers to
 * `/hosted/<host>/<path>`; this handler resolves the domain to its website and
 * serves the SAME royal-oak HTML the /sites surface renders — with the domain
 * as the canonical origin and root-relative links.
 *
 * Fail-closed: domain must exist, be verified + ACTIVE, and its website must
 * be PUBLISHED; otherwise 404. `redirectTo` domains hop to the primary host.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ host: string; slug?: string[] }> },
) {
  const { host: hostRaw, slug } = await params;
  const host = decodeURIComponent(hostRaw).toLowerCase();
  const path = '/' + (slug ?? []).join('/');

  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    select: { websiteId: true, verified: true, status: true, redirectTo: true },
  });
  if (!domain || !domain.verified || domain.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (domain.redirectTo) {
    return NextResponse.redirect(`https://${domain.redirectTo}${path === '/' ? '' : path}`, 308);
  }

  const bundle = await loadSiteBundle(domain.websiteId);
  if (!bundle || bundle.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rendered = await renderHtmlPage(bundle, path, {
    origin: `https://${host}`,
    base: '',
    appOrigin: resolveSiteUrl(),
  });
  if (!rendered) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(rendered.body, {
    status: 200,
    headers: {
      'Content-Type': rendered.contentType,
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  });
}
