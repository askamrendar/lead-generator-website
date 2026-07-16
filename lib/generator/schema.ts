import { z } from 'zod';

/**
 * BusinessConfig — the single source of truth for a generated website.
 *
 * Everything the generator renders (pages, copy, SEO, schema, nav, lead forms)
 * is derived from one object validated by `businessConfigSchema`. To generate a
 * different business's site, produce a different config — no code changes.
 */

export const hoursSchema = z.object({
  day: z.enum([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]),
  /** 24h "HH:MM" or the literal "Closed". */
  open: z.string(),
  close: z.string(),
});

export const serviceSchema = z.object({
  /** URL slug, unique within the business. Auto-derived from name if omitted. */
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  /** One-line summary used in cards, meta descriptions, and nav. */
  shortDescription: z.string().min(1),
  /** Primary keyword this page should rank for. */
  keyword: z.string().min(1).optional(),
  /** Optional hero/card image URL. */
  image: z.string().url().optional(),
  /** Whether this is an emergency/24-7 service (drives emergency CTAs). */
  emergency: z.boolean().default(false),
  /** Bullet benefits. If empty, the content engine synthesizes them. */
  benefits: z.array(z.string()).default([]),
  /** Ordered process/how-it-works steps. Synthesized if empty. */
  process: z.array(z.object({ title: z.string(), description: z.string() })).default([]),
  /** Service-specific FAQs. Synthesized if empty. */
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  /** Optional starting price for display, e.g. "$149". */
  startingPrice: z.string().optional(),
});

export const citySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  county: z.string().optional(),
  zips: z.array(z.string()).default([]),
  neighborhoods: z.array(z.string()).default([]),
  /** Optional lat/lng for geo schema + map embed. */
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const stateSchema = z.object({
  name: z.string().min(1),
  abbr: z.string().length(2),
  slug: z.string().min(1).optional(),
  cities: z.array(citySchema).min(1),
});

export const reviewSchema = z.object({
  author: z.string().min(1),
  rating: z.number().min(1).max(5),
  body: z.string().min(1),
  location: z.string().optional(),
  date: z.string().optional(),
});

export const brandSchema = z.object({
  /** HSL triplets "H S% L%" so they can drop straight into CSS variables. */
  primary: z.string().default('221 83% 53%'),
  primaryForeground: z.string().default('0 0% 100%'),
  accent: z.string().default('24 95% 53%'),
  accentForeground: z.string().default('0 0% 100%'),
  radius: z.string().default('0.75rem'),
});

export const businessConfigSchema = z.object({
  // --- Identity ---
  name: z.string().min(1),
  category: z.string().min(1), // e.g. "Plumbing"
  tagline: z.string().min(1),
  description: z.string().min(1),
  logoText: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // --- Contact ---
  phone: z.string().min(7),
  email: z.string().email(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    stateAbbr: z.string().length(2),
    zip: z.string().min(3),
  }),
  hours: z.array(hoursSchema).default([]),

  // --- Brand ---
  brand: brandSchema.default({}),
  /// Absolute URL or root-relative path (e.g. an AI-generated asset served from
  /// `/api/sites/<id>/asset/<assetId>` — next/image needs relative same-origin paths).
  heroImage: z.string().url().or(z.string().regex(/^\/[^\s]*$/)).optional(),

  // --- Offering ---
  primaryService: z.string().min(1),
  services: z.array(serviceSchema).min(1),

  // --- Geography ---
  country: z.string().default('United States'),
  states: z.array(stateSchema).min(1),
  serviceRadiusMiles: z.number().positive().default(30),

  // --- SEO / marketing ---
  keywords: z.array(z.string()).default([]),
  competitorUrls: z.array(z.string()).default([]),

  // --- Social proof + profiles ---
  reviews: z.array(reviewSchema).default([]),
  ratingValue: z.number().min(1).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  googleBusinessProfile: z.string().url().optional(),
  social: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      x: z.string().url().optional(),
      youtube: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .default({}),

  // --- Trust ---
  yearsInBusiness: z.number().int().nonnegative().optional(),
  licenseNumber: z.string().optional(),
  guarantees: z.array(z.string()).default([]),

  // --- Deployment ---
  /** Canonical production origin, e.g. "https://apexplumbing.com". */
  siteUrl: z.string().url().default('http://localhost:3000'),
});

export type Hours = z.infer<typeof hoursSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type City = z.infer<typeof citySchema>;
export type State = z.infer<typeof stateSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Brand = z.infer<typeof brandSchema>;

/** Fully-resolved config (all defaults applied) — what pages consume. */
export type BusinessConfig = z.infer<typeof businessConfigSchema>;

/**
 * Pre-validation config shape — fields with schema defaults are optional here.
 * Use this to type raw config objects and generator output before parsing.
 */
export type BusinessConfigInput = z.input<typeof businessConfigSchema>;

/** Parse + validate an unknown value into a BusinessConfig (throws on error). */
export function parseBusinessConfig(input: unknown): BusinessConfig {
  return businessConfigSchema.parse(input);
}

/** Safe parse variant for API routes / forms. */
export function safeParseBusinessConfig(input: unknown) {
  return businessConfigSchema.safeParse(input);
}
