import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * HTML template-pack contract — the boundary between the PLATFORM (routing,
 * SEO strings, sitemap/robots, JSON-LD, AI content, service/area enumeration —
 * all owned by `lib/htmlgen/engine.ts`) and a PACK (layout, sections, styling,
 * assets). Packs are pure string-builders: they receive fully-resolved data and
 * return complete HTML documents. No business logic, no I/O, no imports beyond
 * their own sections — so every pack is unit-testable under `node --test`.
 */

export interface TplLink {
  label: string;
  href: string;
}

/** Site-wide chrome context — everything a pack needs on every page. */
export interface PackChrome {
  /** Business display name (header/footer logo text). */
  name: string;
  phone: string;
  telHref: string;
  email: string;
  city: string;
  stateAbbr: string;
  addressLine: string;
  /** Business category, e.g. "Plumbing" — copy building blocks, never layout. */
  category: string;
  tagline: string;
  /** Absolute canonical origin for this site (custom domain or app /sites url). */
  origin: string;
  /** Prefix for internal links: '' at domain root, '/sites/<id>' inside the app. */
  base: string;
  /** Prefix for asset URLs. */
  assets: string;
  /** App origin the lead form posts to. */
  appOrigin: string;
  services: TplLink[];
  areas: TplLink[];
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  /** Hero/banner background image URL (falls back to a brand-color treatment). */
  heroImage?: string;
  /** Pre-formatted opening-hours HTML lines (platform-owned formatting). */
  hoursHtml: string;
  year: number;
}

/** Per-page metadata — computed by the platform, rendered by the pack. */
export interface PackPageMeta {
  title: string;
  description: string;
  /** Site-relative pretty path, e.g. "/services/drain-cleaning". */
  path: string;
  /** Pre-serialized, `<`-escaped JSON-LD document (platform-owned). */
  jsonLd?: string;
}

/** One card in a services/areas grid. */
export interface PackCard {
  label: string;
  href: string;
  blurb: string;
}

/**
 * Per-page renderers — each returns a COMPLETE HTML document. The platform
 * decides which pages exist and what data they get; the pack decides only how
 * they look. Section composition per page lives in the pack because the two
 * designs differ structurally.
 */
export interface HtmlPackRenderer {
  home(
    c: PackChrome,
    m: PackPageMeta,
    d: {
      content: GeneratedPageContent;
      serviceCards: PackCard[];
      areaCards: PackCard[];
      servicesHeading: string;
      servicesSub: string;
      areasHeading: string;
      areasSub: string;
      articleHeading: string;
      ctaLine: string;
    },
  ): string;
  about(
    c: PackChrome,
    m: PackPageMeta,
    d: { content: GeneratedPageContent; heading: string; ctaLine: string },
  ): string;
  contact(c: PackChrome, m: PackPageMeta, d: { heading: string; sub: string }): string;
  servicesIndex(
    c: PackChrome,
    m: PackPageMeta,
    d: {
      /** Home content — supplies the shared reviews/CTA copy. */
      content: GeneratedPageContent;
      serviceCards: PackCard[];
      heading: string;
      sub: string;
      gridHeading: string;
      gridSub: string;
    },
  ): string;
  servicePage(
    c: PackChrome,
    m: PackPageMeta,
    d: {
      content: GeneratedPageContent;
      service: { name: string; slug: string };
      articleHeading: string;
      ctaLine: string;
    },
  ): string;
  areasIndex(
    c: PackChrome,
    m: PackPageMeta,
    d: {
      content: GeneratedPageContent;
      areaCards: PackCard[];
      heading: string;
      sub: string;
      gridHeading: string;
      gridSub: string;
    },
  ): string;
  areaPage(
    c: PackChrome,
    m: PackPageMeta,
    d: {
      content: GeneratedPageContent;
      area: { name: string; slug: string };
      heading: string;
      articleHeading: string;
      ctaLine: string;
    },
  ): string;
}

/** A registered HTML template pack. */
export interface HtmlPack {
  id: string;
  /** User-facing name — sequential ("Template 1"), never a business name. */
  displayName: string;
  description: string;
  /** Directory under public/templates/<assetDir>/assets. */
  assetDir: string;
  /** Default absolute asset prefix when serving through the app. */
  defaultAssetsBase: string;
  render: HtmlPackRenderer;
}
