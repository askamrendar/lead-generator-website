import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { loadSiteBundle, renderSitePage } from '@/lib/websites/render-service';
import { buildMetadata } from '@/lib/seo/metadata';
import { SitePageView } from '@/components/site-render/SitePageView';

/**
 * Custom-domain hosting surface. The middleware rewrites any request on a foreign
 * Host header to `/hosted/<host>/<path>`; this route resolves the domain to its
 * website and renders through the SAME pipeline as `/sites/[websiteId]` — so a
 * connected domain serves the identical site with root-relative links and the
 * domain as the canonical SEO origin.
 *
 * Serving rules (fail-closed):
 *   domain must exist, be verified/ACTIVE, and its website must be PUBLISHED;
 *   otherwise 404. Domains with `redirectTo` hop to the primary host first.
 * Pages are cached per-path (ISR, 5 min) — edits/publishes surface within minutes.
 */

export const revalidate = 300;

interface Params {
  host: string;
  slug?: string[];
}

async function resolveHost(hostRaw: string) {
  const host = decodeURIComponent(hostRaw).toLowerCase();
  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    select: {
      websiteId: true,
      verified: true,
      status: true,
      redirectTo: true,
    },
  });
  if (!domain || !domain.verified || domain.status !== 'ACTIVE') return null;
  return domain;
}

function pathFromSlug(slug: string[] | undefined): string {
  return '/' + (slug ?? []).join('/');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { host, slug } = await params;
  const domain = await resolveHost(host);
  if (!domain) return { robots: { index: false, follow: false } };
  const bundle = await loadSiteBundle(domain.websiteId, `https://${decodeURIComponent(host).toLowerCase()}`);
  if (!bundle || bundle.status !== 'PUBLISHED') return { robots: { index: false, follow: false } };
  const rendered = await renderSitePage(bundle, pathFromSlug(slug));
  if (!rendered) return { robots: { index: false, follow: false } };
  // The custom domain IS the canonical origin — fully indexable. Absolute title:
  // tenant sites must not inherit the app root layout's title template.
  const meta = buildMetadata({
    config: bundle.business,
    title: rendered.route.title,
    description: rendered.ctx.content.metaDescription,
    path: rendered.route.path,
  });
  return {
    ...meta,
    title: { absolute: String(meta.title) },
    applicationName: bundle.business.name,
    authors: [{ name: bundle.business.name }],
  };
}

export default async function HostedSitePage({ params }: { params: Promise<Params> }) {
  const { host, slug } = await params;
  const domain = await resolveHost(host);
  if (!domain) notFound();

  // Apex↔www style redirects configured on the domain record.
  if (domain.redirectTo) {
    redirect(`https://${domain.redirectTo}${pathFromSlug(slug)}`);
  }

  const bundle = await loadSiteBundle(
    domain.websiteId,
    `https://${decodeURIComponent(host).toLowerCase()}`,
  );
  if (!bundle || bundle.status !== 'PUBLISHED') notFound();

  const rendered = await renderSitePage(bundle, pathFromSlug(slug));
  if (!rendered) notFound();

  // Root-relative links: the domain serves the site at its own root.
  return <SitePageView bundle={bundle} rendered={rendered} basePath="" />;
}
