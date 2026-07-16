import type { BusinessConfig } from '@/lib/generator/schema';
import type { SiteRoute } from '@/lib/websites/render-service';
import { getServices } from '@/lib/generator/config';

/**
 * Tenant-site chrome — header nav + footer for GENERATED websites, shared by the
 * hosted route (`/sites/[websiteId]`) and the static export so both surfaces render
 * identical sites. Marketing-site chrome (components/site) stays sample-business-bound;
 * this one is a pure function of (business, routes, basePath).
 *
 * `basePath` prefixes internal links: `/sites/<id>` when hosted inside the app,
 * '' when exported/served from a custom domain root.
 *
 * Links are plain <a> (not next/link): tenant sites are classic multi-page sites,
 * and the static ZIP export SSRs this same tree via renderToStaticMarkup, where
 * client-reference components (next/link) cannot be invoked.
 */

function href(basePath: string, path: string): string {
  const p = `${basePath}${path === '/' ? '' : path}`;
  return p === '' ? '/' : p;
}

export function SiteHeader({
  business,
  basePath,
}: {
  business: BusinessConfig;
  basePath: string;
}) {
  const services = getServices(business).slice(0, 5);
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
        <a href={href(basePath, '/')} className="text-lg font-bold text-foreground">
          {business.name}
        </a>
        <nav aria-label="Site" className="flex flex-wrap items-center gap-4 text-sm">
          {services.map((s) => (
            <a
              key={s.slug}
              href={href(basePath, `/services/${s.slug}`)}
              className="text-muted-fg hover:text-foreground"
            >
              {s.name}
            </a>
          ))}
          <a href={href(basePath, '/about')} className="text-muted-fg hover:text-foreground">
            About
          </a>
          <a href={href(basePath, '/faq')} className="text-muted-fg hover:text-foreground">
            FAQ
          </a>
          <a
            href={href(basePath, '/contact')}
            className="rounded-md bg-brand px-3 py-1.5 font-medium text-brand-fg"
          >
            Contact
          </a>
        </nav>
        <a href={`tel:${business.phone.replace(/[^+\d]/g, '')}`} className="text-sm font-semibold text-brand">
          {business.phone}
        </a>
      </div>
    </header>
  );
}

export function SiteFooter({
  business,
  routes,
  basePath,
}: {
  business: BusinessConfig;
  routes: SiteRoute[];
  basePath: string;
}) {
  const services = routes.filter((r) => r.pageType === 'service').slice(0, 8);
  const cities = routes.filter((r) => r.pageType === 'city').slice(0, 8);
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-bold text-foreground">{business.name}</p>
          <p className="mt-2 text-sm text-muted-fg">{business.tagline}</p>
          <p className="mt-3 text-sm text-muted-fg">
            {business.address.street}, {business.address.city}, {business.address.stateAbbr}{' '}
            {business.address.zip}
          </p>
          <p className="mt-1 text-sm text-muted-fg">
            {business.phone} · {business.email}
          </p>
        </div>
        <nav aria-label="Services">
          <p className="text-sm font-semibold text-foreground">Services</p>
          <ul className="mt-2 space-y-1 text-sm">
            {services.map((r) => (
              <li key={r.path}>
                <a href={href(basePath, r.path)} className="text-muted-fg hover:text-foreground">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Service areas">
          <p className="text-sm font-semibold text-foreground">Service Areas</p>
          <ul className="mt-2 space-y-1 text-sm">
            {cities.map((r) => (
              <li key={r.path}>
                <a href={href(basePath, r.path)} className="text-muted-fg hover:text-foreground">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-muted-fg">
          <span>
            © {year} {business.name}. All rights reserved.
          </span>
          <span className="flex gap-4">
            <a href={href(basePath, '/privacy')} className="hover:text-foreground">
              Privacy
            </a>
            <a href={href(basePath, '/terms')} className="hover:text-foreground">
              Terms
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Breadcrumbs derived from the current route (home → section → page). */
export function SiteBreadcrumbs({
  route,
  basePath,
}: {
  route: SiteRoute;
  basePath: string;
}) {
  if (route.path === '/') return null;
  const crumbs: Array<{ label: string; path: string }> = [{ label: 'Home', path: '/' }];
  if (route.pageType === 'service' || route.pageType === 'serviceCity') {
    // No standalone /services index on tenant sites; link the service page itself.
    if (route.pageType === 'serviceCity' && route.params?.serviceSlug) {
      crumbs.push({
        label: route.title.split(' in ')[0] ?? 'Service',
        path: `/services/${route.params.serviceSlug}`,
      });
    }
  }
  crumbs.push({ label: route.title, path: route.path });
  return (
    <nav aria-label="Breadcrumb" className="container py-3 text-xs text-muted-fg">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            {i > 0 ? <span aria-hidden>›</span> : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {c.label}
              </span>
            ) : (
              <a href={href(basePath, c.path)} className="hover:text-foreground">
                {c.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
