import {
  getServices,
  getCities,
  getNeighborhoods,
} from '@/lib/generator/config';
import {
  buildHomeContext,
  buildAboutContext,
  buildContactContext,
  buildServiceContext,
  buildNeighborhoodContext,
  buildCityContext,
} from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { localBusinessSchema } from '@/lib/seo/schema';
import { telHref, formatPhone } from '@/lib/utils';
import { getHtmlPack } from '@/templates/html/registry';
import { applyPageOverride, type ContentOverrides } from '@/lib/websites/content-overrides';
import type { PackChrome, PackCard } from '@/templates/html/types';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { GeneratedPageContent, PageContext } from '@/lib/ai/types';

/**
 * HTML site generator — renders a complete website from a BusinessConfig
 * through a registered HTML template pack (templates/html/registry). The
 * PLATFORM owns everything here: route enumeration, AI/deterministic content
 * (`resolvePageContent` — cache-first, offline-safe), SEO titles/descriptions,
 * JSON-LD, sitemap and robots. Packs own only markup/sections/styling. Route map:
 *
 *   /                         home (hero + services grid + content + reviews + faq + cta)
 *   /about-us                 about
 *   /contact-us               contact (info + form)
 *   /services                 services index
 *   /services/<service>       one page per service (N services → N pages)
 *   /near-me                  areas index
 *   /near-me/<area>           one page per neighborhood (falls back to cities)
 *   /sitemap.xml, /robots.txt
 */

export interface HtmlPage {
  /** Site-relative pretty path, e.g. "/services/mold-removal". */
  path: string;
  title: string;
  html: string;
}

export interface HtmlSite {
  pages: HtmlPage[];
  sitemapXml: string;
  robotsTxt: string;
}

export interface HtmlGenOptions {
  /** Canonical public origin for SEO (custom domain, else app /sites url). */
  origin: string;
  /** Link prefix when served inside the app ('' for domain root / export). */
  base: string;
  /** Asset URL prefix (default: the pack's app-absolute assets base). */
  assets?: string;
  /** App origin the lead form posts to. */
  appOrigin: string;
  /** HTML pack id (aliases resolved; defaults to Template 1). */
  templateId?: string;
  /** Per-page Site Editor content overrides, keyed by site-relative path. */
  overrides?: ContentOverrides;
}

interface AreaRef {
  name: string;
  slug: string;
  ctx: PageContext | undefined;
}

/** The template's nav/footer area list: neighborhoods first, else the cities. */
function areasFor(business: BusinessConfig): AreaRef[] {
  const hoods = getNeighborhoods(business);
  if (hoods.length > 0) {
    return hoods.map((n) => ({
      name: n.name,
      slug: n.slug,
      ctx: buildNeighborhoodContext(business, n.state.slug, n.city.slug, n.slug),
    }));
  }
  return getCities(business).map(({ state, city }) => ({
    name: city.name,
    slug: city.slug,
    ctx: buildCityContext(business, state.slug, city.slug),
  }));
}

const hoursLine = (business: BusinessConfig): string =>
  business.hours.length > 0
    ? business.hours.map((h) => `${h.day}: ${h.open === 'Closed' ? 'Closed' : `${h.open} – ${h.close}`}`).join('<br>')
    : 'Mon–Sun: 8:00 AM – 8:00 PM';

function chromeFor(business: BusinessConfig, opts: HtmlGenOptions, defaultAssets: string): PackChrome {
  const services = getServices(business).map((s) => ({
    label: s.name,
    href: `/services/${s.slug}`,
  }));
  const areas = areasFor(business).map((a) => ({
    label: a.name,
    href: `/near-me/${a.slug}`,
  }));
  const a = business.address;
  return {
    name: business.name,
    phone: formatPhone(business.phone),
    telHref: telHref(business.phone),
    email: business.email,
    city: a.city,
    stateAbbr: a.stateAbbr,
    addressLine: `${a.street}, ${a.city}, ${a.stateAbbr} ${a.zip}`,
    category: business.category,
    tagline: business.tagline,
    origin: opts.origin,
    base: opts.base,
    assets: opts.assets ?? defaultAssets,
    appOrigin: opts.appOrigin,
    services,
    areas,
    primaryColor: `hsl(${business.brand.primary})`,
    secondaryColor: `hsl(${business.brand.accent})`,
    logoUrl: business.logoUrl,
    heroImage: business.heroImage,
    hoursHtml: hoursLine(business),
    year: new Date().getFullYear(),
  };
}

/** Generate the full site: every page + sitemap + robots. */
export async function generateHtmlSite(
  business: BusinessConfig,
  opts: HtmlGenOptions,
): Promise<HtmlSite> {
  const pack = getHtmlPack(opts.templateId);
  const chrome = chromeFor(business, opts, pack.defaultAssetsBase);
  const services = getServices(business);
  const areas = areasFor(business);
  const jsonLd = JSON.stringify(localBusinessSchema(business)).replace(/</g, '\\u003c');
  const pages: HtmlPage[] = [];

  /** Resolve page content, then merge any Site Editor override for its path. */
  const content = async (ctx: PageContext, path: string): Promise<GeneratedPageContent> => {
    const { content } = await resolvePageContent(ctx);
    return applyPageOverride(content, opts.overrides?.[path]);
  };

  const serviceCards: PackCard[] = services.map((s) => ({
    label: s.name,
    href: `/services/${s.slug}`,
    blurb: s.shortDescription,
  }));
  const areaCards: PackCard[] = areas.map((a) => ({
    label: a.name,
    href: `/near-me/${a.slug}`,
    blurb: `Professional ${business.category.toLowerCase()} services in ${a.name}. Call ${formatPhone(business.phone)} for fast local help.`,
  }));

  // --- Home ---
  const home = await content(buildHomeContext(business), '/');
  pages.push({
    path: '/',
    title: home.seoTitle,
    html: pack.render.home(
      chrome,
      { title: home.seoTitle, description: home.metaDescription, path: '/', jsonLd },
      {
        content: home,
        serviceCards,
        areaCards,
        servicesHeading: `${business.category} Services in ${business.address.city} ${business.address.state}`,
        servicesSub: `Trusted ${business.name} to deliver expert, efficient, and lasting solutions.`,
        areasHeading: 'Areas We Serve',
        areasSub: `Wherever you are in ${business.address.city}, help is close by.`,
        articleHeading: `${business.name} – ${business.tagline}`,
        ctaLine: `Need help today? Same-day ${business.category.toLowerCase()} service available.`,
      },
    ),
  });

  // --- About ---
  const about = await content(buildAboutContext(business), '/about-us');
  pages.push({
    path: '/about-us',
    title: about.seoTitle,
    html: pack.render.about(
      chrome,
      { title: about.seoTitle, description: about.metaDescription, path: '/about-us' },
      {
        content: about,
        heading: `About ${business.name}`,
        ctaLine: `Talk to a local ${business.category.toLowerCase()} expert now.`,
      },
    ),
  });

  // --- Contact ---
  const contact = await content(buildContactContext(business), '/contact-us');
  pages.push({
    path: '/contact-us',
    title: contact.seoTitle,
    html: pack.render.contact(
      chrome,
      { title: contact.seoTitle, description: contact.metaDescription, path: '/contact-us' },
      {
        heading: 'Contact Us',
        sub: `Get in touch for professional ${business.category.toLowerCase()} services in ${business.address.city}, ${business.address.state}`,
      },
    ),
  });

  // --- Services index ---
  pages.push({
    path: '/services',
    title: `Our Services | ${business.name}`,
    html: pack.render.servicesIndex(
      chrome,
      {
        title: `Our Services | ${business.name}`,
        description: `Explore every ${business.category.toLowerCase()} service ${business.name} offers in ${business.address.city}, ${business.address.stateAbbr}.`,
        path: '/services',
      },
      {
        content: home,
        serviceCards,
        heading: `Our ${business.address.city} ${business.address.stateAbbr} ${business.category} Services`,
        sub: business.tagline,
        gridHeading: 'Everything We Do',
        gridSub: `Full-service ${business.category.toLowerCase()} — one call covers it all.`,
      },
    ),
  });

  // --- Service pages (one per user-entered service) ---
  for (const s of services) {
    const ctx = buildServiceContext(business, s.slug);
    if (!ctx) continue;
    const path = `/services/${s.slug}`;
    const c = await content(ctx, path);
    pages.push({
      path,
      title: c.seoTitle,
      html: pack.render.servicePage(
        chrome,
        { title: c.seoTitle, description: c.metaDescription, path },
        {
          content: c,
          service: { name: s.name, slug: s.slug },
          articleHeading: `${s.name} in ${business.address.city}, ${business.address.stateAbbr}`,
          ctaLine: `Ready for ${s.name.toLowerCase()}? We're one call away.`,
        },
      ),
    });
  }

  // --- Areas index ---
  pages.push({
    path: '/near-me',
    title: `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr} | ${business.name}`,
    html: pack.render.areasIndex(
      chrome,
      {
        title: `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr}`,
        description: `${business.name} serves ${areas.map((a) => a.name).join(', ')} — find fast local ${business.category.toLowerCase()} near you.`,
        path: '/near-me',
      },
      {
        content: home,
        areaCards,
        heading: `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr}`,
        sub: 'Local crews across every neighborhood we serve.',
        gridHeading: 'Areas We Serve',
        gridSub: `Wherever you are in ${business.address.city}, help is close by.`,
      },
    ),
  });

  // --- Area pages (only from user-provided locations) ---
  for (const a of areas) {
    if (!a.ctx) continue;
    const path = `/near-me/${a.slug}`;
    const c = await content(a.ctx, path);
    pages.push({
      path,
      title: c.seoTitle,
      html: pack.render.areaPage(
        chrome,
        { title: c.seoTitle, description: c.metaDescription, path },
        {
          content: c,
          area: { name: a.name, slug: a.slug },
          heading: `${business.category} in ${a.name}`,
          articleHeading: `${business.category} Services in ${a.name}`,
          ctaLine: `Serving ${a.name} with same-day availability.`,
        },
      ),
    });
  }

  // --- Sitemap + robots ---
  const sitemapXml = buildSitemap(opts.origin, pages.map((p) => p.path));
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${opts.origin}/sitemap.xml\n`;

  return { pages, sitemapXml, robotsTxt };
}

/** Match a URL path to its page. Pure string normalization. */
export function normalizePath(path: string): string {
  const clean = ('/' + path.replace(/^\/+|\/+$/g, '')).replace(/\/{2,}/g, '/');
  return clean === '' ? '/' : clean;
}

export interface ContentPageRef {
  /** Site-relative path — the Site Editor override key. */
  path: string;
  /** Human label for editor navigation. */
  label: string;
  group: 'core' | 'service' | 'area';
  ctx: PageContext;
}

/**
 * Every content-editable page of a site (same route map as generateHtmlSite,
 * without rendering). The Site Editor lists these and keys overrides by path.
 */
export function enumerateContentPages(business: BusinessConfig): ContentPageRef[] {
  const pages: ContentPageRef[] = [
    { path: '/', label: 'Home', group: 'core', ctx: buildHomeContext(business) },
    { path: '/about-us', label: 'About Us', group: 'core', ctx: buildAboutContext(business) },
    { path: '/contact-us', label: 'Contact Us', group: 'core', ctx: buildContactContext(business) },
  ];
  for (const s of getServices(business)) {
    const ctx = buildServiceContext(business, s.slug);
    if (ctx) pages.push({ path: `/services/${s.slug}`, label: s.name, group: 'service', ctx });
  }
  for (const a of areasFor(business)) {
    if (a.ctx) pages.push({ path: `/near-me/${a.slug}`, label: a.name, group: 'area', ctx: a.ctx });
  }
  return pages;
}

export function buildSitemap(origin: string, paths: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = paths
    .map(
      (p) =>
        `  <url><loc>${origin}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
