import { JsonLd } from '@/components/seo/JsonLd';
import { localBusinessSchema, breadcrumbSchema } from '@/lib/seo/schema';
import { ThemeProvider } from '@/components/builder/ThemeProvider';
import { BlockRenderer } from '@/components/builder/BlockRenderer';
import { SiteHeader, SiteFooter, SiteBreadcrumbs } from '@/components/site-render/SiteShell';
import { websiteRoutes } from '@/lib/websites/render-service';
import type { RenderedPage, SiteBundle } from '@/lib/websites/render-service';
import type { BlockComponent } from '@/lib/builder/types';

/**
 * The complete rendered tenant page — theme, JSON-LD, chrome, blocks. Shared by the
 * app-origin preview surface (`/sites/[websiteId]`), custom-domain hosting
 * (`/hosted/[host]`), and the static ZIP export (which passes block `overrides` to
 * swap interactive blocks for no-JS-safe equivalents), so every surface serves the
 * same site apart from link base paths.
 */
export function SitePageView({
  bundle,
  rendered,
  basePath,
  overrides,
}: {
  bundle: SiteBundle;
  rendered: RenderedPage;
  basePath: string;
  overrides?: Record<string, BlockComponent>;
}) {
  const routes = websiteRoutes(bundle.business);
  const crumbs = [
    { name: 'Home', path: '/' },
    ...(rendered.route.path === '/'
      ? []
      : [{ name: rendered.route.title, path: rendered.route.path }]),
  ];

  return (
    <ThemeProvider themeId={rendered.themeId}>
      <JsonLd data={localBusinessSchema(bundle.business)} />
      <JsonLd data={breadcrumbSchema(bundle.business, crumbs)} />
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <SiteHeader business={bundle.business} basePath={basePath} />
        <SiteBreadcrumbs route={rendered.route} basePath={basePath} />
        <main id="main" className="flex-1">
          <BlockRenderer page={rendered.page} ctx={rendered.ctx} overrides={overrides} />
        </main>
        <SiteFooter business={bundle.business} routes={routes} basePath={basePath} />
      </div>
    </ThemeProvider>
  );
}
