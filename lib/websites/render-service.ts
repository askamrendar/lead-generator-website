import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { safeParseBusinessConfig } from '@/lib/generator/schema';
import { wizardToBusinessConfig } from '@/lib/websites/business-adapter';
import {
  getCities,
  getServiceCityMatrix,
  getServices,
} from '@/lib/generator/config';
import {
  buildAboutContext,
  buildCityContext,
  buildContactContext,
  buildFaqContext,
  buildHomeContext,
  buildServiceCityContext,
  buildServiceContext,
} from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { composePage } from '@/lib/builder/compose';
import { buildBlockContext } from '@/lib/builder/context';
import { selectBuild } from '@/lib/builder/select';
import { getTemplate } from '@/templates/registry';
import { resolveHtmlPackId } from '@/templates/html/registry';
import { parseContentOverrides, type ContentOverrides } from '@/lib/websites/content-overrides';
import { normalizeDocument } from '@/lib/builder/editor/document';
import { legalPage } from '@/lib/websites/legal-pages';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { PageContext, PageType } from '@/lib/ai/types';
import type { BlockContext, PageDefinition, ThemeId } from '@/lib/builder/types';
import type { BuilderDocument } from '@/lib/builder/editor/types';
import type { WebsiteWizardInput } from '@/lib/websites/schema';

/**
 * Per-website render service — THE bridge between a tenant `Website` row and the
 * existing generation engine. Pages are deterministic functions of
 * (template, BusinessConfig), so nothing here stores pages: it enumerates a website's
 * routes from its OWN business config and composes each page through the same
 * `composePage → resolvePageContent → buildBlockContext` pipeline the marketing site
 * uses for the sample business. The user-edited home page (BuilderDocument) overrides
 * the composed home. No generation logic is duplicated — only wired to tenant data.
 */

// ---------------------------------------------------------------------------
// Business config resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a website's own BusinessConfig from its stored wizard input. Pure.
 * Returns null when the website has no (or an invalid) business configuration —
 * callers decide the fallback (the dashboard shows an honest empty state).
 */
export function businessFromWizard(raw: unknown): BusinessConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    const input = wizardToBusinessConfig(raw as WebsiteWizardInput);
    const parsed = safeParseBusinessConfig(input);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface SiteBundle {
  websiteId: string;
  name: string;
  slug: string;
  status: string;
  business: BusinessConfig;
  document: BuilderDocument;
  templateId: string;
  /** HTML pack id (templates/html/registry) — resolved from the RAW row value,
   *  independent of the block-template selection above. */
  htmlTemplateId: string;
  /** Site Editor per-page content overrides (parsed, defensive). */
  contentOverrides: ContentOverrides;
  themeId: ThemeId;
  industryId: string;
}

type WebsiteRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  businessConfig: unknown;
  builderConfig: unknown;
  contentOverrides?: unknown;
  themeId: string | null;
  templateId: string | null;
  industryId: string | null;
};

/** Assemble the render bundle from an already-loaded row (no extra queries). Pure. */
export function bundleFromRow(row: WebsiteRow, origin?: string): SiteBundle | null {
  let business = businessFromWizard(row.businessConfig);
  if (!business) return null;
  // Canonical origin for SEO output (sitemap/canonicals/JSON-LD @id). The surface
  // decides: custom domain for exports/hosting, app origin for previews.
  if (origin) business = { ...business, siteUrl: origin };
  // Respect the stored selection (from generation); fall back to the deterministic
  // selector so even a never-generated site renders sensibly.
  const selection = selectBuild(business, {
    templateId: row.templateId ?? undefined,
    themeId: (row.themeId as ThemeId | null) ?? undefined,
    industryId: row.industryId ?? undefined,
  });
  const home = composePage(selection.template, 'home', `${business.name} — Home`);
  const document = normalizeDocument(row.builderConfig, home, selection.themeId);
  return {
    websiteId: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    business,
    document,
    templateId: selection.template.id,
    // HTML pack id — resolved from the RAW row value (falling back to the wizard's
    // brand choice before first generation), independent of the block selection.
    htmlTemplateId: resolveHtmlPackId(
      row.templateId ??
        (row.businessConfig as { brand?: { templateId?: string } } | null)?.brand?.templateId,
    ),
    contentOverrides: parseContentOverrides(row.contentOverrides),
    themeId: document.themeId,
    industryId: selection.industry.id,
  };
}

/**
 * SYSTEM-level bundle loader (no session) — used by the public hosting route (which
 * gates on published status itself) and the export pipeline (authorized at enqueue).
 */
export async function loadSiteBundle(
  websiteId: string,
  origin?: string,
): Promise<SiteBundle | null> {
  const row = await prisma.website.findUnique({
    where: { id: websiteId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      businessConfig: true,
      builderConfig: true,
      contentOverrides: true,
      themeId: true,
      templateId: true,
      industryId: true,
    },
  });
  return row ? bundleFromRow(row, origin) : null;
}

/** Session-guarded variant for dashboard surfaces. */
export async function getSiteBundle(
  websiteId: string,
  origin?: string,
): Promise<SiteBundle | null> {
  await requireWebsiteAccess(websiteId, 'website:view');
  return loadSiteBundle(websiteId, origin);
}

// ---------------------------------------------------------------------------
// Route enumeration — every page a website has
// ---------------------------------------------------------------------------

export interface SiteRoute {
  /** Site-relative path, e.g. "/services/drain-cleaning/texas/austin". */
  path: string;
  pageType: PageType | 'privacy' | 'terms';
  title: string;
  params?: { serviceSlug?: string; stateSlug?: string; citySlug?: string };
}

/** Enumerate all routes for a business — the site map, derived (never stored). Pure. */
export function websiteRoutes(business: BusinessConfig): SiteRoute[] {
  const routes: SiteRoute[] = [
    { path: '/', pageType: 'home', title: business.name },
    { path: '/about', pageType: 'about', title: `About ${business.name}` },
    { path: '/contact', pageType: 'contact', title: 'Contact' },
    { path: '/faq', pageType: 'faq', title: 'Frequently Asked Questions' },
    { path: '/privacy', pageType: 'privacy', title: 'Privacy Policy' },
    { path: '/terms', pageType: 'terms', title: 'Terms of Service' },
  ];
  for (const s of getServices(business)) {
    routes.push({
      path: `/services/${s.slug}`,
      pageType: 'service',
      title: s.name,
      params: { serviceSlug: s.slug },
    });
  }
  for (const { state, city } of getCities(business)) {
    routes.push({
      path: `/locations/${state.slug}/${city.slug}`,
      pageType: 'city',
      title: `${city.name}, ${state.abbr}`,
      params: { stateSlug: state.slug, citySlug: city.slug },
    });
  }
  for (const { service, state, city } of getServiceCityMatrix(business)) {
    routes.push({
      path: `/services/${service.slug}/${state.slug}/${city.slug}`,
      pageType: 'serviceCity',
      title: `${service.name} in ${city.name}, ${state.abbr}`,
      params: { serviceSlug: service.slug, stateSlug: state.slug, citySlug: city.slug },
    });
  }
  return routes;
}

/** Match a URL path (e.g. "/services/x/y/z") to its route. Pure. */
export function matchRoute(business: BusinessConfig, path: string): SiteRoute | null {
  const clean = ('/' + path.replace(/^\/+|\/+$/g, '')).replace(/\/{2,}/g, '/');
  return websiteRoutes(business).find((r) => r.path === clean) ?? null;
}

// ---------------------------------------------------------------------------
// Page rendering — path → { PageDefinition, BlockContext }
// ---------------------------------------------------------------------------

export interface RenderedPage {
  route: SiteRoute;
  page: PageDefinition;
  ctx: BlockContext;
  themeId: ThemeId;
  /** Where the copy came from — 'ai' when a cached AI generation exists. */
  contentSource: 'ai' | 'fallback';
}

function contextForRoute(business: BusinessConfig, route: SiteRoute): PageContext | null {
  const p = route.params ?? {};
  switch (route.pageType) {
    case 'home':
      return buildHomeContext(business);
    case 'about':
      return buildAboutContext(business);
    case 'contact':
      return buildContactContext(business);
    case 'faq':
      return buildFaqContext(business);
    case 'service':
      return buildServiceContext(business, p.serviceSlug ?? '') ?? null;
    case 'city':
      return buildCityContext(business, p.stateSlug ?? '', p.citySlug ?? '') ?? null;
    case 'serviceCity':
      return (
        buildServiceCityContext(
          business,
          p.serviceSlug ?? '',
          p.stateSlug ?? '',
          p.citySlug ?? '',
        ) ?? null
      );
    default:
      return null; // privacy/terms are composed without an AI context
  }
}

/**
 * Render any page of a website through the standard pipeline. The home page honors
 * the user's Visual Builder edits: published sites render the published snapshot,
 * otherwise the current draft. All other pages compose from the template.
 */
export async function renderSitePage(
  bundle: SiteBundle,
  path: string,
): Promise<RenderedPage | null> {
  const route = matchRoute(bundle.business, path);
  if (!route) return null;

  const template = getTemplate(bundle.templateId);

  // Legal pages: deterministic rich-text compositions (no AI context needed).
  if (route.pageType === 'privacy' || route.pageType === 'terms') {
    const page = legalPage(route.pageType, bundle.business);
    const homeCtx = buildHomeContext(bundle.business);
    const { content } = await resolvePageContent(homeCtx);
    const ctx = buildBlockContext(homeCtx, content, bundle.themeId, bundle.industryId);
    return { route, page, ctx, themeId: bundle.themeId, contentSource: 'fallback' };
  }

  const pageCtx = contextForRoute(bundle.business, route);
  if (!pageCtx) return null;

  const { content, source } = await resolvePageContent(pageCtx);
  const ctx = buildBlockContext(pageCtx, content, bundle.themeId, bundle.industryId);

  let page: PageDefinition;
  let themeId = bundle.themeId;
  if (route.pageType === 'home') {
    // The ONLY user-edited page. Published snapshot wins for live surfaces;
    // the current draft is what the owner previews.
    const doc = bundle.document;
    const snap = doc.status === 'PUBLISHED' && doc.published ? doc.published : doc;
    page = snap.page;
    themeId = snap.themeId ?? themeId;
  } else {
    page = composePage(template, route.pageType, route.title);
  }

  return { route, page, ctx, themeId, contentSource: source };
}

// ---------------------------------------------------------------------------
// HTML-template rendering — the serving path for tenant sites
// ---------------------------------------------------------------------------

import { generateHtmlSite, normalizePath, type HtmlSite } from '@/lib/htmlgen/engine';

export interface HtmlRenderOptions {
  /** Canonical public origin (custom domain, else the app /sites URL). */
  origin: string;
  /** Link prefix when served inside the app ('' at a domain root / export). */
  base: string;
  /** Asset prefix override (export uses relative "assets"). */
  assets?: string;
  /** Origin the lead form posts to (this app). */
  appOrigin: string;
}

/**
 * Build the full HTML site for a bundle via its chosen template pack. Content
 * is cache-first (AI when warmed, deterministic otherwise), so this is cheap
 * and repeatable — surfaces call it per request; ISR/CDN caching sits above.
 */
export async function renderHtmlSite(bundle: SiteBundle, opts: HtmlRenderOptions): Promise<HtmlSite> {
  return generateHtmlSite(bundle.business, {
    ...opts,
    templateId: bundle.htmlTemplateId,
    overrides: bundle.contentOverrides,
  });
}

/** Render one page (or sitemap/robots) of a website's HTML site. */
export async function renderHtmlPage(
  bundle: SiteBundle,
  path: string,
  opts: HtmlRenderOptions,
): Promise<{ body: string; contentType: string } | null> {
  const clean = normalizePath(path);
  const site = await renderHtmlSite(bundle, opts);
  if (clean === '/sitemap.xml') return { body: site.sitemapXml, contentType: 'application/xml; charset=utf-8' };
  if (clean === '/robots.txt') return { body: site.robotsTxt, contentType: 'text/plain; charset=utf-8' };
  const page = site.pages.find((p) => p.path === clean);
  return page ? { body: page.html, contentType: 'text/html; charset=utf-8' } : null;
}
