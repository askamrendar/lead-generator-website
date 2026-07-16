import type { WebsiteWizardInput } from '@/lib/websites/schema';
import type { BusinessConfigInput } from '@/lib/generator/schema';
import { findUsState, usStateAbbr, cleanUsZips } from '../geo/us-states.ts';

/**
 * Pure adapter: wizard `businessConfig` (stored on Website) → generator
 * `BusinessConfigInput` (what the AI/builder/SEO engines consume).
 *
 * This is an ADAPTER, not generation logic — it only reshapes existing wizard data
 * into the engine's input contract so the AI Generator can reuse `aiSelectBuild` +
 * `composePage` + the content engine without any parallel flow. Fields the wizard
 * doesn't collect are left to the generator schema's defaults / content synthesis.
 * No I/O, no clock → unit-testable.
 */

/** Convert a hex color (#rrggbb) to an HSL triplet "H S% L%" for CSS variables. */
export function hexToHslTriplet(hex: string, fallback: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return fallback;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Map the wizard input into a generator BusinessConfigInput. Returns the *input*
 * shape (defaults unresolved) — the caller runs it through `parseBusinessConfig`
 * (or `safeParseBusinessConfig`) so the generator schema fills defaults + validates.
 */
export function wizardToBusinessConfig(wizard: WebsiteWizardInput): BusinessConfigInput {
  const { business, location, brand, details, seo } = wizard;

  const services = [business.primaryService, ...(business.additionalServices ?? [])]
    .filter(Boolean)
    .map((name) => ({
      name,
      shortDescription: `Professional ${name.toLowerCase()} for homes and businesses in ${location.city}.`,
    }));

  // Canonical state resolution via the USA geo pack: "new york"/"ny"/"New York"
  // all resolve to { name: 'New York', abbr: 'NY' }. Unknown (non-US) states keep
  // the typed name with a best-effort 2-letter abbreviation.
  const usState = findUsState(location.state);
  const stateName = usState?.name ?? location.state;
  const stateAbbr = usState?.abbr ?? usStateAbbr(location.state);

  // Validate/split/dedupe ZIPs ("87496 76032" → two entries; invalid dropped).
  const zips = cleanUsZips(location.zipCodes ?? []);

  // Primary city + any additional cities (deduped, primary first). Each city gets
  // its own location page + service×city pages from the engine's selectors.
  const extraCities = (location.additionalCities ?? []).filter(
    (c) => c.toLowerCase() !== location.city.toLowerCase(),
  );
  const cities = [
    {
      name: location.city,
      zips,
      neighborhoods: location.neighborhoods ?? [],
    },
    ...Array.from(new Set(extraCities.map((c) => c.trim()).filter(Boolean))).map((name) => ({
      name,
      zips: [] as string[],
      neighborhoods: [] as string[],
    })),
  ];

  return {
    // Identity
    name: business.businessName,
    category: business.category,
    tagline: `${business.category} you can trust in ${location.city}`,
    description: `${business.businessName} provides professional ${business.category.toLowerCase()} services in ${location.city}, ${location.state}.`,
    logoUrl: brand.logoUrl && brand.logoUrl.length > 0 ? brand.logoUrl : undefined,

    // Contact
    phone: details.phone,
    email: details.email,
    address: {
      // The wizard collects no street (service-area business model). Emit an honest
      // service-area line rather than a fabricated street number; the generator schema
      // requires a non-empty value.
      street: `${location.city} Service Area`,
      city: location.city,
      state: stateName,
      stateAbbr,
      zip: zips[0] || '00000',
    },

    // Brand — map hex wizard colors to HSL triplets the theme system expects.
    brand: {
      primary: hexToHslTriplet(brand.primaryColor, '221 83% 53%'),
      accent: hexToHslTriplet(brand.accentColor, '24 95% 53%'),
    },

    // Offering
    primaryService: business.primaryService,
    services: services.length > 0 ? services : [{ name: business.category, shortDescription: `${business.category} services.` }],

    // Geography — the resolved state with the primary + additional cities.
    country: location.country || 'United States',
    states: [
      {
        name: stateName,
        abbr: stateAbbr,
        cities,
      },
    ],

    // SEO / social
    keywords: seo.targetKeywords ?? [],
    competitorUrls: (seo.competitors ?? []).filter((u) => /^https?:\/\//.test(u)),
    social: {
      facebook: details.facebook || undefined,
      instagram: details.instagram || undefined,
      x: details.x || undefined,
    },
  };
}
