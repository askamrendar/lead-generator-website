import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSiteBundle, renderSitePage } from '@/lib/websites/render-service';
import { requireWebsiteAccess, isAccessError } from '@/lib/auth/access';
import { buildMetadata } from '@/lib/seo/metadata';
import { SitePageView } from '@/components/site-render/SitePageView';
import { staticOverrides } from '@/lib/export/static-blocks';
import { resolveSiteUrl } from '@/lib/site';

/**
 * Per-website site surface — renders ANY page of ANY tenant website through the
 * standard pipeline (render-service → SitePageView → BlockRenderer). This route is:
 *   M3 — the live preview URL (`/sites/<id>`, owner-only while unpublished), and
 *   the app-origin serving surface custom-domain hosting rewrites into (M5).
 *
 * PUBLISHED websites are publicly viewable; anything else requires owner access and
 * fails closed as 404 (tenant-hidden). The `/sites/*` app-origin surface is always
 * noindex — the indexable canonical lives on the site's own custom domain.
 */

interface Params {
  websiteId: string;
  slug?: string[];
}

function pathFromSlug(slug: string[] | undefined): string {
  return '/' + (slug ?? []).join('/');
}

async function loadAuthorized(websiteId: string) {
  const bundle = await loadSiteBundle(websiteId, `${resolveSiteUrl()}/sites/${websiteId}`);
  if (!bundle) return null;
  if (bundle.status !== 'PUBLISHED') {
    // Draft/generated sites are visible to their owner only — fail closed.
    try {
      await requireWebsiteAccess(websiteId, 'website:view');
    } catch (err) {
      if (isAccessError(err)) return null;
      throw err;
    }
  }
  return bundle;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { websiteId, slug } = await params;
  const bundle = await loadAuthorized(websiteId);
  if (!bundle) return { robots: { index: false, follow: false } };
  const rendered = await renderSitePage(bundle, pathFromSlug(slug));
  if (!rendered) return { robots: { index: false, follow: false } };
  const meta = buildMetadata({
    config: bundle.business,
    title: rendered.route.title,
    description: rendered.ctx.content.metaDescription,
    path: rendered.route.path,
    noindex: true, // app-origin surface; the custom domain is the canonical home
  });
  // Absolute title + own application/author identity: tenant sites must not
  // inherit the app root layout's `%s | <sample business>` template or meta.
  return {
    ...meta,
    title: { absolute: String(meta.title) },
    applicationName: bundle.business.name,
    authors: [{ name: bundle.business.name }],
  };
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ static?: string }>;
}) {
  const { websiteId, slug } = await params;
  const bundle = await loadAuthorized(websiteId);
  if (!bundle) notFound();

  const rendered = await renderSitePage(bundle, pathFromSlug(slug));
  if (!rendered) notFound();

  // `?static=1` (used by the ZIP export) swaps interactive blocks for no-JS-safe
  // equivalents: plain <form> posting to this app's /api/lead, <details> FAQ.
  const { static: staticFlag } = await searchParams;
  const overrides = staticFlag === '1' ? staticOverrides(resolveSiteUrl()) : undefined;

  return (
    <SitePageView
      bundle={bundle}
      rendered={rendered}
      basePath={`/sites/${websiteId}`}
      overrides={overrides}
    />
  );
}
