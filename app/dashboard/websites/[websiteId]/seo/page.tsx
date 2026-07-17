import { notFound } from 'next/navigation';
import { Search, ExternalLink } from 'lucide-react';
import { getWebsite } from '@/lib/websites/service';
import { businessFromWizard } from '@/lib/websites/render-service';
import { generateHtmlSite } from '@/lib/htmlgen/engine';
import { resolveSiteUrl } from '@/lib/site';
import { isAccessError } from '@/lib/auth/access';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Website SEO tab — a real, read-only SEO report derived from the website's own
 * business config through the render service: the full route map (every page the
 * site serves), keyword targets, and the structured-data/sitemap facts. No new
 * SEO logic — it surfaces what the engine already generates.
 */
export default async function WebsiteSeoPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  let website;
  try {
    website = await getWebsite(websiteId);
  } catch (err) {
    if (isAccessError(err)) notFound();
    throw err;
  }

  const business = businessFromWizard(website.businessConfig);
  if (!business) {
    return (
      <EmptyState
        icon={Search}
        title="No business configuration"
        description="Complete the website's configuration to see its SEO footprint."
      />
    );
  }

  const appOrigin = resolveSiteUrl();
  const site = await generateHtmlSite(business, {
    origin: `${appOrigin}/sites/${websiteId}`,
    base: `/sites/${websiteId}`,
    appOrigin,
  });
  const routes = site.pages.map((p) => ({
    path: p.path,
    title: p.title,
    pageType:
      p.path === '/' ? 'home'
      : p.path.startsWith('/services/') ? 'service'
      : p.path.startsWith('/near-me/') ? 'area'
      : p.path.replace(/^\//, '').replace(/-us$/, '') || 'page',
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-fg">Total pages</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{routes.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-fg">Target keywords</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{business.keywords.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-fg">Structured data</p>
          <p className="mt-1 text-2xl font-bold text-foreground">LocalBusiness + Breadcrumbs</p>
        </Card>
      </div>

      {business.keywords.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Target keywords</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {business.keywords.map((k) => (
              <Badge key={k} variant="muted">{k}</Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Page map <span className="font-normal text-muted-fg">— every URL this website serves</span>
        </h3>
        <Card className="divide-y divide-border overflow-hidden">
          {routes.map((r) => (
            <div key={r.path} className="flex items-center justify-between gap-3 px-5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{r.title}</p>
                <p className="truncate font-mono text-xs text-muted-fg">{r.path}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{r.pageType}</Badge>
                <a
                  href={`/sites/${websiteId}${r.path === '/' ? '' : r.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-fg hover:text-foreground"
                  aria-label={`Open ${r.title}`}
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
