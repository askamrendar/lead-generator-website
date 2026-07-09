import {
  absoluteUrl,
  formatAddress,
  getServices,
} from '@/lib/generator/config';
import type {
  ResolvedCity,
  ResolvedService,
} from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

/**
 * JSON-LD structured-data builders. Each returns a plain object that pages
 * embed via <JsonLd />. Kept framework-agnostic and typed as `Record`.
 */

type Json = Record<string, unknown>;

function openingHours(config: BusinessConfig): Json[] {
  const dayMap: Record<string, string> = {
    Monday: 'Mo',
    Tuesday: 'Tu',
    Wednesday: 'We',
    Thursday: 'Th',
    Friday: 'Fr',
    Saturday: 'Sa',
    Sunday: 'Su',
  };
  return config.hours
    .filter((h) => h.open.toLowerCase() !== 'closed')
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayMap[h.day],
      opens: h.open,
      closes: h.close,
    }));
}

/** Core LocalBusiness node reused across pages. */
export function localBusinessSchema(config: BusinessConfig): Json {
  const node: Json = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluteUrl(config, '/#business'),
    name: config.name,
    description: config.description,
    url: config.siteUrl,
    telephone: config.phone,
    email: config.email,
    image: config.heroImage,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.street,
      addressLocality: config.address.city,
      addressRegion: config.address.stateAbbr,
      postalCode: config.address.zip,
      addressCountry: 'US',
    },
    areaServed: config.states.flatMap((s) =>
      s.cities.map((c) => ({
        '@type': 'City',
        name: c.name,
      })),
    ),
    openingHoursSpecification: openingHours(config),
    sameAs: Object.values(config.social).filter(Boolean),
  };

  if (config.ratingValue && config.ratingCount) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: config.ratingValue,
      reviewCount: config.ratingCount,
    };
  }
  return node;
}

export function organizationSchema(config: BusinessConfig): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl(config, '/#organization'),
    name: config.name,
    url: config.siteUrl,
    logo: config.logoUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: config.phone,
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: 'English',
    },
    sameAs: Object.values(config.social).filter(Boolean),
  };
}

export function websiteSchema(config: BusinessConfig): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl(config, '/#website'),
    url: config.siteUrl,
    name: config.name,
    description: config.description,
    publisher: { '@id': absoluteUrl(config, '/#organization') },
  };
}

export function serviceSchema(
  config: BusinessConfig,
  service: ResolvedService,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    serviceType: service.name,
    description: service.shortDescription,
    provider: { '@id': absoluteUrl(config, '/#business') },
    areaServed: config.states.flatMap((s) =>
      s.cities.map((c) => ({ '@type': 'City', name: c.name })),
    ),
    url: absoluteUrl(config, `/services/${service.slug}`),
    ...(service.startingPrice
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: service.startingPrice.replace(/[^0-9.]/g, ''),
          },
        }
      : {}),
  };
}

export function locationServiceSchema(
  config: BusinessConfig,
  city: ResolvedCity,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${config.primaryService} in ${city.name}`,
    provider: { '@id': absoluteUrl(config, '/#business') },
    areaServed: {
      '@type': 'City',
      name: city.name,
      ...(city.lat && city.lng
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: city.lat,
              longitude: city.lng,
            },
          }
        : {}),
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${config.category} services`,
      itemListElement: getServices(config).map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name },
      })),
    },
  };
}

export function faqSchema(
  faqs: Array<{ question: string; answer: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbSchema(
  config: BusinessConfig,
  crumbs: Array<{ name: string; path: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(config, c.path),
    })),
  };
}

export function reviewSchema(config: BusinessConfig): Json[] {
  return config.reviews.map((r) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@id': absoluteUrl(config, '/#business') },
    author: { '@type': 'Person', name: r.author },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
    },
    reviewBody: r.body,
    ...(r.date ? { datePublished: r.date } : {}),
  }));
}

/** Service node scoped to a specific city (used by the matrix pages). */
export function serviceInCitySchema(
  config: BusinessConfig,
  service: ResolvedService,
  city: ResolvedCity,
  stateAbbr: string,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} in ${city.name}, ${stateAbbr}`,
    serviceType: service.name,
    description: service.shortDescription,
    provider: { '@id': absoluteUrl(config, '/#business') },
    areaServed: {
      '@type': 'City',
      name: city.name,
      ...(city.lat && city.lng
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: city.lat,
              longitude: city.lng,
            },
          }
        : {}),
    },
    url: absoluteUrl(
      config,
      `/services/${service.slug}/${stateAbbr.toLowerCase()}/${city.slug}`,
    ),
  };
}

/** Geo place schema for a county / ZIP / neighborhood served area. */
export function placeSchema(
  config: BusinessConfig,
  input: {
    type: 'AdministrativeArea' | 'PostalCodeArea' | 'Place';
    name: string;
    url: string;
    containedIn?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  },
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    name: input.name,
    url: absoluteUrl(config, input.url),
    ...(input.postalCode ? { postalCode: input.postalCode } : {}),
    ...(input.containedIn
      ? { containedInPlace: { '@type': 'AdministrativeArea', name: input.containedIn } }
      : {}),
    ...(input.lat && input.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.lat,
            longitude: input.lng,
          },
        }
      : {}),
  };
}

/** Speakable specification pointing at CSS selectors read aloud by assistants. */
export function speakableSchema(
  config: BusinessConfig,
  url: string,
  cssSelectors: string[] = ['h1', '.speakable-intro'],
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: absoluteUrl(config, url),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  };
}

/** ImageObject schema for gallery / hero images. */
export function imageObjectSchema(
  url: string,
  caption: string,
  width = 1600,
  height = 1200,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: url,
    url,
    caption,
    width,
    height,
  };
}

/** Article schema for blog / editorial pages (used by future Blog Engine). */
export function articleSchema(
  config: BusinessConfig,
  input: {
    title: string;
    description: string;
    url: string;
    image?: string;
    datePublished?: string;
    author?: string;
  },
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(config, input.url),
    ...(input.image ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    author: { '@type': 'Organization', name: input.author ?? config.name },
    publisher: { '@id': absoluteUrl(config, '/#organization') },
  };
}

/** Combine multiple nodes into a single @graph document. */
export function graph(nodes: Json[]): Json {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.map((node) => {
      const copy = { ...node };
      delete copy['@context'];
      return copy;
    }),
  };
}

/** Convenience: the full address as a display string (re-exported for pages). */
export { formatAddress };
