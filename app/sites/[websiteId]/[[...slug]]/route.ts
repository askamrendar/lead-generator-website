import { NextResponse } from 'next/server';
import { loadSiteBundle, renderHtmlPage } from '@/lib/websites/render-service';
import { requireWebsiteAccess, isAccessError } from '@/lib/auth/access';
import { resolveSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';

/**
 * Per-website site surface — serves ANY page of ANY tenant website as full
 * HTML from the royal-oak template (lib/htmlgen). This route is the live
 * preview URL (`/sites/<id>`, owner-only while unpublished) and the app-origin
 * surface custom-domain hosting rewrites into.
 *
 * PUBLISHED → public; anything else requires owner access and fails closed as
 * 404 (tenant-hidden). Always noindex here — the indexable canonical lives on
 * the site's own custom domain.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ websiteId: string; slug?: string[] }> },
) {
  const { websiteId, slug } = await params;

  const bundle = await loadSiteBundle(websiteId);
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (bundle.status !== 'PUBLISHED') {
    try {
      await requireWebsiteAccess(websiteId, 'website:view');
    } catch (err) {
      if (isAccessError(err)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      throw err;
    }
  }

  const appOrigin = resolveSiteUrl();
  const rendered = await renderHtmlPage(bundle, '/' + (slug ?? []).join('/'), {
    origin: `${appOrigin}/sites/${websiteId}`,
    base: `/sites/${websiteId}`,
    appOrigin,
  });
  if (!rendered) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(rendered.body, {
    status: 200,
    headers: {
      'Content-Type': rendered.contentType,
      // App-origin surface is never the canonical — keep crawlers out.
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': bundle.status === 'PUBLISHED' ? 'public, max-age=0, s-maxage=300' : 'no-store',
    },
  });
}
