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
import {
  pageShell,
  heroSection,
  innerBanner,
  servicesGridSection,
  contentSection,
  ctaSmallSection,
  testimonialsSection,
  faqSection,
  ctaBottomSection,
  contactSection,
  type TplChrome,
} from '@/templates/html/royal-oak/sections';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { GeneratedPageContent, PageContext } from '@/lib/ai/types';

/**
 * HTML site generator — renders a complete website from a BusinessConfig using
 * the "royal-oak" HTML template (the ONLY template; more packs land later as
 * sibling modules). Content comes from the existing AI/deterministic engine
 * (`resolvePageContent` — cache-first, offline-safe); this module only maps it
 * into the template's sections. Route map:
 *
 *   /                         home (hero + services grid + content + reviews + faq + cta)
 *   /about-us                 about
 *   /contact-us               contact (info + form + map)
 *   /services                 services index
 *   /services/<service>       one page per service
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
  /** Asset URL prefix (default: app-absolute /templates/royal-oak/assets). */
  assets?: string;
  /** App origin the lead form posts to. */
  appOrigin: string;
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

function chromeFor(business: BusinessConfig, opts: HtmlGenOptions): TplChrome {
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
    origin: opts.origin,
    base: opts.base,
    assets: opts.assets ?? '/templates/royal-oak/assets',
    services,
    areas,
    primaryColor: `hsl(${business.brand.primary})`,
    secondaryColor: `hsl(${business.brand.accent})`,
    logoUrl: business.logoUrl,
    heroImage: business.heroImage,
    year: new Date().getFullYear(),
  };
}

const hoursLine = (business: BusinessConfig): string =>
  business.hours.length > 0
    ? business.hours.map((h) => `${h.day}: ${h.open === 'Closed' ? 'Closed' : `${h.open} – ${h.close}`}`).join('<br>')
    : 'Mon–Sun: 8:00 AM – 8:00 PM';

async function content(ctx: PageContext): Promise<GeneratedPageContent> {
  const { content } = await resolvePageContent(ctx);
  return content;
}

const reviewList = (c: GeneratedPageContent) =>
  c.reviews.map((r) => ({ text: r.body, author: r.author }));

/** Long-form article body shared by home/service/area pages. */
function articleHtml(c: GeneratedPageContent, heading: string): string {
  const process = c.process
    .map((p) => `<li><strong>${p.title}</strong> – ${p.description}</li>`)
    .join('');
  const benefits = c.benefits.map((b) => `<li>${b}</li>`).join('');
  const why = c.whyChooseUs.map((w) => `<p>✔ <strong>${w}</strong></p>`).join('');
  return [
    `<h2>${heading}</h2>`,
    `<p>${c.intro}</p>`,
    process ? `<h2>Our Process</h2><ol>${process}</ol>` : '',
    benefits ? `<h2>Why It Matters</h2><ul>${benefits}</ul>` : '',
    why ? `<h2>Why Choose Us?</h2>${why}` : '',
  ].join('');
}

/** Generate the full site: every page + sitemap + robots. */
export async function generateHtmlSite(
  business: BusinessConfig,
  opts: HtmlGenOptions,
): Promise<HtmlSite> {
  const chrome = chromeFor(business, opts);
  const services = getServices(business);
  const areas = areasFor(business);
  const jsonLd = JSON.stringify(localBusinessSchema(business)).replace(/</g, '\\u003c');
  const pages: HtmlPage[] = [];

  // --- Home ---
  const homeCtx = buildHomeContext(business);
  const home = await content(homeCtx);
  pages.push({
    path: '/',
    title: home.seoTitle,
    html: pageShell(chrome, {
      title: home.seoTitle,
      description: home.metaDescription,
      path: '/',
      jsonLd,
      body: [
        heroSection(chrome, { heading: home.heroHeading, copy: home.heroCopy, appOrigin: opts.appOrigin }),
        servicesGridSection(chrome, {
          heading: `${business.category} Services in ${business.address.city} ${business.address.state}`,
          sub: `Trusted ${business.name} to deliver expert, efficient, and lasting solutions.`,
          cards: services.map((s) => ({
            label: s.name,
            href: `/services/${s.slug}`,
            blurb: s.shortDescription,
          })),
        }),
        contentSection(articleHtml(home, `${business.name} – ${business.tagline}`)),
        ctaSmallSection(chrome, `Need help today? Same-day ${business.category.toLowerCase()} service available.`),
        testimonialsSection(reviewList(home)),
        faqSection(home.faqs),
        ctaBottomSection(chrome, { heading: home.cta.title, copy: home.cta.description }),
      ].join('\n'),
    }),
  });

  // --- About ---
  const about = await content(buildAboutContext(business));
  pages.push({
    path: '/about-us',
    title: about.seoTitle,
    html: pageShell(chrome, {
      title: about.seoTitle,
      description: about.metaDescription,
      path: '/about-us',
      body: [
        innerBanner(chrome, `About ${business.name}`, about.heroCopy),
        contentSection(articleHtml(about, about.heroHeading)),
        ctaSmallSection(chrome, `Talk to a local ${business.category.toLowerCase()} expert now.`),
        testimonialsSection(reviewList(about)),
        ctaBottomSection(chrome, { heading: about.cta.title, copy: about.cta.description }),
      ].join('\n'),
    }),
  });

  // --- Contact ---
  const contact = await content(buildContactContext(business));
  pages.push({
    path: '/contact-us',
    title: contact.seoTitle,
    html: pageShell(chrome, {
      title: contact.seoTitle,
      description: contact.metaDescription,
      path: '/contact-us',
      body: [
        innerBanner(
          chrome,
          'Contact Us',
          `Get in touch for professional ${business.category.toLowerCase()} services in ${business.address.city}, ${business.address.state}`,
        ),
        contactSection(chrome, { appOrigin: opts.appOrigin, hours: hoursLine(business) }),
      ].join('\n'),
    }),
  });

  // --- Services index ---
  pages.push({
    path: '/services',
    title: `Our Services | ${business.name}`,
    html: pageShell(chrome, {
      title: `Our Services | ${business.name}`,
      description: `Explore every ${business.category.toLowerCase()} service ${business.name} offers in ${business.address.city}, ${business.address.stateAbbr}.`,
      path: '/services',
      body: [
        innerBanner(chrome, `Our ${business.address.city} ${business.address.stateAbbr} ${business.category} Services`, business.tagline),
        servicesGridSection(chrome, {
          heading: 'Everything We Do',
          sub: `Full-service ${business.category.toLowerCase()} — one call covers it all.`,
          cards: services.map((s) => ({ label: s.name, href: `/services/${s.slug}`, blurb: s.shortDescription })),
        }),
        testimonialsSection(reviewList(home)),
        ctaBottomSection(chrome, { heading: home.cta.title, copy: home.cta.description }),
      ].join('\n'),
    }),
  });

  // --- Service pages ---
  for (const s of services) {
    const ctx = buildServiceContext(business, s.slug);
    if (!ctx) continue;
    const c = await content(ctx);
    const path = `/services/${s.slug}`;
    pages.push({
      path,
      title: c.seoTitle,
      html: pageShell(chrome, {
        title: c.seoTitle,
        description: c.metaDescription,
        path,
        body: [
          innerBanner(chrome, c.heroHeading, c.heroCopy),
          contentSection(articleHtml(c, `${s.name} in ${business.address.city}, ${business.address.stateAbbr}`)),
          ctaSmallSection(chrome, `Ready for ${s.name.toLowerCase()}? We're one call away.`),
          faqSection(c.faqs),
          ctaBottomSection(chrome, { heading: c.cta.title, copy: c.cta.description }),
        ].join('\n'),
      }),
    });
  }

  // --- Areas index ---
  pages.push({
    path: '/near-me',
    title: `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr} | ${business.name}`,
    html: pageShell(chrome, {
      title: `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr}`,
      description: `${business.name} serves ${areas.map((a) => a.name).join(', ')} — find fast local ${business.category.toLowerCase()} near you.`,
      path: '/near-me',
      body: [
        innerBanner(chrome, `${business.category} near Me in ${business.address.city} ${business.address.stateAbbr}`, `Local crews across every neighborhood we serve.`),
        servicesGridSection(chrome, {
          heading: 'Areas We Serve',
          sub: `Wherever you are in ${business.address.city}, help is close by.`,
          cards: areas.map((a) => ({
            label: a.name,
            href: `/near-me/${a.slug}`,
            blurb: `Professional ${business.category.toLowerCase()} services in ${a.name}. Call ${formatPhone(business.phone)} for fast local help.`,
          })),
        }),
        testimonialsSection(reviewList(home)),
        ctaBottomSection(chrome, { heading: home.cta.title, copy: home.cta.description }),
      ].join('\n'),
    }),
  });

  // --- Area pages ---
  for (const a of areas) {
    if (!a.ctx) continue;
    const c = await content(a.ctx);
    const path = `/near-me/${a.slug}`;
    pages.push({
      path,
      title: c.seoTitle,
      html: pageShell(chrome, {
        title: c.seoTitle,
        description: c.metaDescription,
        path,
        body: [
          innerBanner(chrome, `${business.category} in ${a.name}`, c.heroCopy),
          contentSection(articleHtml(c, `${business.category} Services in ${a.name}`)),
          ctaSmallSection(chrome, `Serving ${a.name} with same-day availability.`),
          faqSection(c.faqs),
          ctaBottomSection(chrome, { heading: c.cta.title, copy: c.cta.description }),
        ].join('\n'),
      }),
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
