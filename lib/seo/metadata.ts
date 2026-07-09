import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

/**
 * SEO metadata builders. Every page composes its `<head>` from these so titles,
 * canonicals, and social cards stay consistent across the generated site.
 */

interface GeoMeta {
  lat: number;
  lng: number;
  /** Human place name, e.g. "Austin, TX". */
  placename: string;
  /** ISO 3166-2 region code, e.g. "US-TX". */
  region?: string;
}

interface PageMetaInput {
  config: BusinessConfig;
  title: string;
  description: string;
  /** Site-relative path, e.g. "/services/drain-cleaning". */
  path: string;
  image?: string;
  noindex?: boolean;
  /** Optional geo tags for location-specific pages. */
  geo?: GeoMeta;
  /** Keyword overrides for this page (falls back to config keywords). */
  keywords?: string[];
}

export function buildMetadata({
  config,
  title,
  description,
  path,
  image,
  noindex,
  geo,
  keywords,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(config, path);
  const fullTitle =
    path === '/' ? `${config.name} | ${config.tagline}` : `${title} | ${config.name}`;
  const ogImage = image ?? config.heroImage;

  const geoTags: Record<string, string> = geo
    ? {
        'geo.placename': geo.placename,
        'geo.position': `${geo.lat};${geo.lng}`,
        ICBM: `${geo.lat}, ${geo.lng}`,
        ...(geo.region ? { 'geo.region': geo.region } : {}),
      }
    : {};

  const pageKeywords = keywords?.length
    ? keywords
    : config.keywords.length
      ? config.keywords
      : undefined;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      // Single-locale site today; declares the canonical language for hreflang.
      languages: { 'en-US': url },
    },
    keywords: pageKeywords,
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      siteName: config.name,
      title: fullTitle,
      description,
      locale: 'en_US',
      images: ogImage ? [{ url: ogImage, alt: fullTitle }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    ...(geo ? { other: geoTags } : {}),
  };
}

/** Root metadata (metadataBase + defaults) applied in app/layout.tsx. */
export function buildRootMetadata(config: BusinessConfig): Metadata {
  return {
    metadataBase: new URL(config.siteUrl),
    title: {
      default: `${config.name} | ${config.tagline}`,
      template: `%s | ${config.name}`,
    },
    description: config.description,
    applicationName: config.name,
    authors: [{ name: config.name }],
    generator: 'Lead Generator Website',
    formatDetection: { telephone: true, address: true, email: true },
  };
}
