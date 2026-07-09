import {
  parseBusinessConfig,
  type BusinessConfig,
  type BusinessConfigInput,
} from '@/lib/generator/schema';
import { resolveSiteUrl, assertProductionSiteUrl } from '@/lib/site';

/**
 * Sample business config — Apex Plumbing Co.
 *
 * This is the demo input the Generator Core renders into a full website.
 * Swap this object (or load one produced by /generate) to generate a different
 * business's site. It is validated by the Zod schema at import time, so a bad
 * config fails fast at build.
 */
const raw = {
  name: 'Apex Plumbing Co.',
  category: 'Plumbing',
  tagline: 'Fast, Honest Plumbing — Done Right',
  description:
    'Apex Plumbing Co. is a licensed, family-owned plumbing company serving the greater Austin area with fast response, upfront pricing, and guaranteed workmanship on repairs, installations, and 24/7 emergencies.',
  logoText: 'Apex Plumbing',
  phone: '512-555-0142',
  email: 'service@apexplumbingco.com',
  address: {
    street: '1200 Springdale Rd',
    city: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    zip: '78721',
  },
  hours: [
    { day: 'Monday', open: '07:00', close: '19:00' },
    { day: 'Tuesday', open: '07:00', close: '19:00' },
    { day: 'Wednesday', open: '07:00', close: '19:00' },
    { day: 'Thursday', open: '07:00', close: '19:00' },
    { day: 'Friday', open: '07:00', close: '19:00' },
    { day: 'Saturday', open: '08:00', close: '16:00' },
    { day: 'Sunday', open: 'Closed', close: 'Closed' },
  ],
  brand: {
    primary: '211 90% 42%',
    primaryForeground: '0 0% 100%',
    accent: '18 96% 52%',
    accentForeground: '0 0% 100%',
    radius: '0.75rem',
  },
  heroImage:
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1600&q=80',
  primaryService: 'Plumbing Services',
  services: [
    {
      name: 'Drain Cleaning',
      shortDescription:
        'Clear slow and clogged drains fast with professional hydro-jetting and camera inspection.',
      keyword: 'drain cleaning austin',
      emergency: false,
      startingPrice: '$99',
      image:
        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Water Heater Repair & Installation',
      shortDescription:
        'Repair, replace, and install tank and tankless water heaters with same-day service.',
      keyword: 'water heater repair austin',
      emergency: false,
      startingPrice: '$149',
    },
    {
      name: 'Emergency Plumbing',
      shortDescription:
        '24/7 response for burst pipes, major leaks, and overflowing fixtures — day or night.',
      keyword: 'emergency plumber austin',
      emergency: true,
    },
    {
      name: 'Leak Detection & Repair',
      shortDescription:
        'Pinpoint hidden leaks with non-invasive tools and stop water damage before it spreads.',
      keyword: 'leak detection austin',
      emergency: false,
    },
    {
      name: 'Sewer Line Repair',
      shortDescription:
        'Trenchless sewer line repair and replacement with camera diagnostics and warranties.',
      keyword: 'sewer line repair austin',
      emergency: false,
    },
    {
      name: 'Faucet & Fixture Installation',
      shortDescription:
        'Upgrade faucets, sinks, toilets, and fixtures with clean, code-compliant installation.',
      keyword: 'faucet installation austin',
      emergency: false,
    },
  ],
  country: 'United States',
  states: [
    {
      name: 'Texas',
      abbr: 'TX',
      cities: [
        {
          name: 'Austin',
          county: 'Travis County',
          zips: ['78701', '78702', '78721', '78745', '78751'],
          neighborhoods: [
            'Mueller',
            'East Austin',
            'Hyde Park',
            'South Congress',
            'Zilker',
          ],
          lat: 30.2672,
          lng: -97.7431,
        },
        {
          name: 'Round Rock',
          county: 'Williamson County',
          zips: ['78664', '78665', '78681'],
          neighborhoods: ['Forest Creek', 'Teravista', 'Brushy Creek'],
          lat: 30.5083,
          lng: -97.6789,
        },
        {
          name: 'Cedar Park',
          county: 'Williamson County',
          zips: ['78613', '78630'],
          neighborhoods: ['Buttercup Creek', 'Twin Creeks'],
          lat: 30.5052,
          lng: -97.8203,
        },
        {
          name: 'Pflugerville',
          county: 'Travis County',
          zips: ['78660', '78691'],
          neighborhoods: ['Blackhawk', 'Falcon Pointe'],
          lat: 30.4394,
          lng: -97.62,
        },
      ],
    },
  ],
  serviceRadiusMiles: 35,
  keywords: [
    'plumber austin',
    'austin plumbing company',
    'emergency plumber austin tx',
    'drain cleaning austin',
    'water heater repair austin',
  ],
  competitorUrls: [],
  reviews: [
    {
      author: 'Marcus D.',
      rating: 5,
      body: 'Called about a burst pipe at 11pm and a tech was at my door within the hour. Fair price, clean work, explained everything. Lifesavers.',
      location: 'Austin, TX',
      date: '2026-03-14',
    },
    {
      author: 'Priya R.',
      rating: 5,
      body: 'They replaced our water heater the same day we called. Upfront quote, no surprises, and they hauled the old one away. Highly recommend.',
      location: 'Round Rock, TX',
      date: '2026-02-02',
    },
    {
      author: 'Tom K.',
      rating: 5,
      body: 'Professional from start to finish. The camera inspection found the real problem instead of guessing. Honest company.',
      location: 'Cedar Park, TX',
      date: '2026-01-19',
    },
  ],
  ratingValue: 4.9,
  ratingCount: 287,
  googleBusinessProfile: 'https://www.google.com/maps',
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
  },
  yearsInBusiness: 18,
  licenseNumber: 'TX-MPL-42817',
  guarantees: [
    '100% satisfaction guarantee',
    'Upfront flat-rate pricing',
    'Licensed & insured technicians',
    'On-time arrival windows',
  ],
  // Derived from NEXT_PUBLIC_SITE_URL (single source of truth in lib/site.ts).
  // Set that env var to your public https origin so every canonical URL, OG
  // tag, sitemap entry, robots host, and JSON-LD @id points at the real domain.
  siteUrl: resolveSiteUrl(),
} satisfies BusinessConfigInput;

/** Validated, fully-defaulted business config used across the app. */
export const business: BusinessConfig = parseBusinessConfig(raw);

// Surface a misconfigured origin at build time. Warns for the zero-env demo;
// a real deployment can enforce a hard failure with ALLOW_LOCALHOST_BUILD unset
// and stricter CI, or by calling assertProductionSiteUrl(url, { strict: true }).
assertProductionSiteUrl(business.siteUrl);
