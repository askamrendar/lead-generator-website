import { pick } from '@/lib/utils';
import type { BusinessConfig } from '@/lib/generator/schema';
import type {
  ResolvedCity,
  ResolvedCounty,
  ResolvedNeighborhood,
  ResolvedService,
  ResolvedState,
  ResolvedZip,
} from '@/lib/generator/config';

/**
 * Content engine.
 *
 * Produces marketing copy for every generated page. Copy is *deterministic*
 * (seeded by stable strings) so builds are reproducible and identical inputs
 * yield identical output — but it is *varied per page* (service slug, city name)
 * so pages are not byte-identical duplicate content.
 *
 * ── LLM SEAM ──────────────────────────────────────────────────────────────
 * Each exported function is a drop-in seam. To use real AI, replace the body
 * with a Vercel AI SDK / OpenAI call that takes the same arguments and returns
 * the same shape. Callers never change. Example:
 *
 *   export async function serviceIntro(...) {
 *     const { text } = await generateText({ model: openai('gpt-4o'), prompt });
 *     return text;
 *   }
 *
 * (The signatures below are synchronous for the offline core; widening them to
 *  async only requires awaiting at the call sites, which are all Server
 *  Components.)
 * ───────────────────────────────────────────────────────────────────────────
 */

// --- Homepage ----------------------------------------------------------------

export function homeHeroHeadline(config: BusinessConfig): string {
  const city = config.address.city;
  const templates = [
    `${config.primaryService} in ${city} You Can Count On`,
    `${city}'s Trusted ${config.category} Experts`,
    `Fast, Reliable ${config.primaryService} Across ${city}`,
    `Professional ${config.category} Services in ${city}`,
  ];
  return pick(templates, `home-hero-${config.name}`);
}

export function homeHeroSubhead(config: BusinessConfig): string {
  const years = config.yearsInBusiness
    ? `For over ${config.yearsInBusiness} years, `
    : '';
  const templates = [
    `${years}${config.name} has delivered honest, high-quality ${config.category.toLowerCase()} work with upfront pricing and workmanship you can trust.`,
    `${years}homeowners and businesses choose ${config.name} for dependable ${config.category.toLowerCase()} service, on-time arrivals, and results that last.`,
    `${years}we treat every job like it's our own home — licensed technicians, clear estimates, and a satisfaction guarantee on every visit.`,
  ];
  return pick(templates, `home-sub-${config.name}`);
}

// --- Service pages -----------------------------------------------------------

export function serviceIntro(
  config: BusinessConfig,
  service: ResolvedService,
): string {
  const city = config.address.city;
  const openers = [
    `When you need ${service.name.toLowerCase()} in ${city}, you want it done right the first time.`,
    `${service.name} problems rarely happen at a convenient time — and in ${city}, they can get worse fast.`,
    `Reliable ${service.name.toLowerCase()} is about more than a quick fix.`,
  ];
  const middles = [
    `That's why ${config.name} pairs experienced, background-checked technicians with clear, upfront pricing.`,
    `${config.name} brings the tools, training, and transparency to solve the problem — not just patch it.`,
    `Our team at ${config.name} diagnoses the real cause, explains your options, and completes the work to code.`,
  ];
  const closers = [
    `No surprises, no pressure — just dependable ${service.name.toLowerCase()} backed by a satisfaction guarantee.`,
    `We leave the site clean and the job done, and we stand behind every visit.`,
    `From the first call to the final walkthrough, we make the process simple.`,
  ];
  const seed = `svc-intro-${service.slug}`;
  return [
    pick(openers, seed + 'a'),
    pick(middles, seed + 'b'),
    pick(closers, seed + 'c'),
  ].join(' ');
}

export function serviceBenefits(
  config: BusinessConfig,
  service: ResolvedService,
): string[] {
  if (service.benefits.length > 0) return service.benefits;
  const pool = [
    `Upfront, flat-rate pricing on ${service.name.toLowerCase()} — approved before we start`,
    'Licensed, insured, and background-checked technicians',
    'On-time arrivals with real appointment windows',
    'Clean, respectful service that protects your home',
    `Workmanship guarantee on every ${service.name.toLowerCase()} job`,
    'Straightforward answers — no upselling, no pressure',
    `Fast scheduling across ${config.address.city} and nearby areas`,
    'Financing options available on larger projects',
  ];
  // Deterministically rotate the starting point so services differ.
  const start = pool.length
    ? Math.abs(hashSeed(service.slug)) % pool.length
    : 0;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, 5);
}

export function serviceProcess(
  service: ResolvedService,
): Array<{ title: string; description: string }> {
  if (service.process.length > 0) return service.process;
  return [
    {
      title: 'Book Your Visit',
      description: `Call or request service online. We'll confirm a convenient window for your ${service.name.toLowerCase()}.`,
    },
    {
      title: 'On-Site Diagnosis',
      description:
        'A licensed technician inspects the issue, identifies the root cause, and walks you through the options.',
    },
    {
      title: 'Upfront Quote',
      description:
        'You approve a clear, flat-rate price before any work begins — no surprises later.',
    },
    {
      title: 'Expert Completion',
      description: `We complete the ${service.name.toLowerCase()} to code, test our work, and leave the area clean.`,
    },
  ];
}

export function serviceFaqs(
  config: BusinessConfig,
  service: ResolvedService,
): Array<{ question: string; answer: string }> {
  if (service.faqs.length > 0) return service.faqs;
  const city = config.address.city;
  return [
    {
      question: `How much does ${service.name.toLowerCase()} cost in ${city}?`,
      answer: `Every job is different, so ${config.name} provides an upfront, flat-rate quote after a quick on-site diagnosis${
        service.startingPrice ? `. Common jobs start around ${service.startingPrice}.` : '.'
      } You approve the price before we begin.`,
    },
    {
      question: `How soon can you come out?`,
      answer: `We offer fast scheduling across ${city} and the surrounding ${config.serviceRadiusMiles}-mile service area${
        service.emergency ? ', including 24/7 emergency response for urgent issues.' : '.'
      }`,
    },
    {
      question: `Are your technicians licensed and insured?`,
      answer: `Yes. Every ${config.name} technician is licensed, fully insured, and background-checked, and all work is completed to local code.`,
    },
    {
      question: `Do you guarantee your work?`,
      answer: `Absolutely. Our ${service.name.toLowerCase()} is backed by a workmanship guarantee, and we'll make it right if anything isn't up to standard.`,
    },
  ];
}

export function serviceMetaDescription(
  config: BusinessConfig,
  service: ResolvedService,
): string {
  return `${service.name} in ${config.address.city} by ${config.name}. ${service.shortDescription} Upfront pricing, licensed technicians, satisfaction guaranteed. Call ${config.phone}.`.slice(
    0,
    160,
  );
}

// --- Location pages ----------------------------------------------------------

export function locationIntro(
  config: BusinessConfig,
  city: ResolvedCity,
): string {
  const openers = [
    `${config.name} proudly serves homeowners and businesses throughout ${city.name}.`,
    `Looking for dependable ${config.category.toLowerCase()} in ${city.name}? You're in the right place.`,
    `From established neighborhoods to new developments, ${city.name} trusts ${config.name} for ${config.category.toLowerCase()}.`,
  ];
  const middles = [
    `Our local technicians know ${city.name}'s homes, common issues, and permitting — so you get a faster, more accurate fix.`,
    `We combine local knowledge of ${city.name} with the same upfront pricing and guaranteed workmanship we're known for.`,
    `Whether it's a routine repair or an urgent problem, our ${city.name} team responds quickly and gets it done right.`,
  ];
  const neighborhoods =
    city.neighborhoods.length > 0
      ? ` We regularly serve ${listToProse(city.neighborhoods.slice(0, 4))} and surrounding areas.`
      : '';
  const seed = `loc-intro-${city.slug}`;
  return (
    pick(openers, seed + 'a') +
    ' ' +
    pick(middles, seed + 'b') +
    neighborhoods
  );
}

export function locationMetaDescription(
  config: BusinessConfig,
  city: ResolvedCity,
): string {
  return `${config.primaryService} in ${city.name}, ${config.address.stateAbbr}. ${config.name} offers licensed ${config.category.toLowerCase()} with upfront pricing and guaranteed work. Serving ${city.name} and nearby areas — call ${config.phone}.`.slice(
    0,
    160,
  );
}

export function locationWhyLocal(
  config: BusinessConfig,
  city: ResolvedCity,
): string[] {
  return [
    `Local ${city.name} technicians who know the area`,
    `Fast response across ${city.name}${city.zips.length ? ` (${city.zips.slice(0, 3).join(', ')})` : ''}`,
    `Upfront, flat-rate pricing — approved before work starts`,
    `Licensed, insured, and guaranteed workmanship`,
  ];
}

// --- Service × City matrix pages ---------------------------------------------

export function serviceCityIntro(
  config: BusinessConfig,
  service: ResolvedService,
  city: ResolvedCity,
): string {
  const openers = [
    `Searching for ${service.name.toLowerCase()} in ${city.name}? ${config.name} is the local team homeowners rely on.`,
    `${config.name} delivers fast, dependable ${service.name.toLowerCase()} throughout ${city.name} and the surrounding area.`,
    `For quality ${service.name.toLowerCase()} in ${city.name}, ${config.name} combines local expertise with upfront pricing.`,
  ];
  const middles = [
    `Our ${city.name} technicians arrive on time, diagnose the real issue, and quote a flat rate before any work starts.`,
    `We know ${city.name}'s homes and the problems they face, so your ${service.name.toLowerCase()} gets solved right the first time.`,
    `From the first call to the final walkthrough, we make ${service.name.toLowerCase()} in ${city.name} simple and stress-free.`,
  ];
  const closers = [
    `Every ${service.name.toLowerCase()} job is backed by our satisfaction guarantee.`,
    `Licensed, insured, and guaranteed — that's how we work in ${city.name}.`,
    `Call now for same-day ${service.name.toLowerCase()} scheduling in ${city.name}.`,
  ];
  const seed = `svc-city-${service.slug}-${city.slug}`;
  return [
    pick(openers, seed + 'a'),
    pick(middles, seed + 'b'),
    pick(closers, seed + 'c'),
  ].join(' ');
}

export function serviceCityMetaDescription(
  config: BusinessConfig,
  service: ResolvedService,
  city: ResolvedCity,
  stateAbbr: string,
): string {
  return `${service.name} in ${city.name}, ${stateAbbr} by ${config.name}. ${service.shortDescription} Upfront pricing, licensed local techs, satisfaction guaranteed. Call ${config.phone}.`.slice(
    0,
    160,
  );
}

export function serviceCityFaqs(
  config: BusinessConfig,
  service: ResolvedService,
  city: ResolvedCity,
): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Do you offer ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Yes — ${config.name} provides ${service.name.toLowerCase()} throughout ${city.name}${
        city.zips.length ? ` (${city.zips.slice(0, 3).join(', ')})` : ''
      } and nearby neighborhoods with fast, local scheduling.`,
    },
    {
      question: `How fast can you get to ${city.name}?`,
      answer: `We offer same-day and next-day availability across ${city.name}${
        service.emergency ? ', plus 24/7 emergency response for urgent situations.' : '.'
      }`,
    },
    {
      question: `What does ${service.name.toLowerCase()} cost in ${city.name}?`,
      answer: `You'll get an upfront, flat-rate quote after a quick diagnosis${
        service.startingPrice ? `; common jobs start around ${service.startingPrice}.` : '.'
      } No surprises, ever.`,
    },
  ];
}

// --- County hub pages --------------------------------------------------------

export function countyIntro(
  config: BusinessConfig,
  county: ResolvedCounty,
): string {
  const cityNames = listToProse(county.cities.map((c) => c.name).slice(0, 5));
  const openers = [
    `${config.name} provides trusted ${config.category.toLowerCase()} across ${county.name}.`,
    `Homeowners throughout ${county.name} count on ${config.name} for dependable ${config.category.toLowerCase()}.`,
    `From one end of ${county.name} to the other, ${config.name} delivers fast, guaranteed ${config.category.toLowerCase()}.`,
  ];
  const middles = cityNames
    ? [
        `We serve communities including ${cityNames}, with the same upfront pricing and quality workmanship in every one.`,
        `Our licensed crews cover ${cityNames} and everywhere in between.`,
      ]
    : [
        `Our licensed crews cover the entire county with upfront pricing and guaranteed work.`,
      ];
  const seed = `county-${county.slug}`;
  return pick(openers, seed + 'a') + ' ' + pick(middles, seed + 'b');
}

export function countyMetaDescription(
  config: BusinessConfig,
  county: ResolvedCounty,
): string {
  return `${config.primaryService} in ${county.name}. ${config.name} serves ${county.cities
    .map((c) => c.name)
    .slice(0, 3)
    .join(', ')} and beyond with licensed, guaranteed ${config.category.toLowerCase()}. Call ${config.phone}.`.slice(
    0,
    160,
  );
}

// --- ZIP pages ---------------------------------------------------------------

export function zipIntro(config: BusinessConfig, target: ResolvedZip): string {
  const openers = [
    `Need ${config.category.toLowerCase()} in the ${target.zip} area? ${config.name} has you covered.`,
    `${config.name} provides fast, local ${config.category.toLowerCase()} to ${target.zip} in ${target.city.name}.`,
    `Serving ZIP code ${target.zip} and the rest of ${target.city.name}, ${config.name} is your local ${config.category.toLowerCase()} team.`,
  ];
  const middles = [
    `Our technicians know ${target.city.name} and respond quickly with upfront, flat-rate pricing.`,
    `Same-day scheduling, licensed pros, and guaranteed workmanship — right here in ${target.zip}.`,
  ];
  const seed = `zip-${target.zip}`;
  return pick(openers, seed + 'a') + ' ' + pick(middles, seed + 'b');
}

export function zipMetaDescription(
  config: BusinessConfig,
  target: ResolvedZip,
): string {
  return `${config.primaryService} in ${target.zip} (${target.city.name}, ${target.state.abbr}). ${config.name} offers licensed, guaranteed ${config.category.toLowerCase()} with upfront pricing. Call ${config.phone}.`.slice(
    0,
    160,
  );
}

// --- Neighborhood pages ------------------------------------------------------

export function neighborhoodIntro(
  config: BusinessConfig,
  n: ResolvedNeighborhood,
): string {
  const openers = [
    `${config.name} is proud to serve the ${n.name} neighborhood in ${n.city.name}.`,
    `Looking for ${config.category.toLowerCase()} in ${n.name}? ${config.name} is right around the corner.`,
    `Neighbors in ${n.name} trust ${config.name} for reliable ${config.category.toLowerCase()}.`,
  ];
  const middles = [
    `We know ${n.name}'s homes and respond fast with upfront pricing and guaranteed work.`,
    `From quick repairs to full installs, our ${n.city.name} crews treat ${n.name} like their own backyard.`,
  ];
  const seed = `nbhd-${n.city.slug}-${n.slug}`;
  return pick(openers, seed + 'a') + ' ' + pick(middles, seed + 'b');
}

export function neighborhoodMetaDescription(
  config: BusinessConfig,
  n: ResolvedNeighborhood,
): string {
  return `${config.primaryService} in ${n.name}, ${n.city.name}. ${config.name} offers licensed, guaranteed ${config.category.toLowerCase()} with upfront pricing. Serving ${n.name} — call ${config.phone}.`.slice(
    0,
    160,
  );
}

// --- State hub pages ---------------------------------------------------------

export function stateHubIntro(
  config: BusinessConfig,
  state: ResolvedState,
): string {
  const cities = listToProse(state.cities.map((c) => c.name).slice(0, 5));
  const openers = [
    `${config.name} delivers dependable ${config.category.toLowerCase()} across ${state.name}.`,
    `Wherever you are in ${state.name}, ${config.name} brings fast, guaranteed ${config.category.toLowerCase()} to your door.`,
  ];
  const middles = cities
    ? [
        `We serve ${cities} and communities throughout the state with upfront pricing and licensed technicians.`,
      ]
    : [`We serve communities statewide with upfront pricing and licensed technicians.`];
  const seed = `state-${state.slug}`;
  return pick(openers, seed + 'a') + ' ' + pick(middles, seed + 'b');
}

// --- Location statistics, problems, emergency copy ---------------------------

export function locationStats(
  config: BusinessConfig,
  placeName: string,
): Array<{ value: string; label: string }> {
  return [
    config.yearsInBusiness
      ? { value: `${config.yearsInBusiness}+`, label: 'Years Serving Locals' }
      : { value: 'Local', label: 'Family Owned' },
    { value: '24/7', label: `${placeName} Emergency Service` },
    config.ratingCount
      ? { value: `${config.ratingValue ?? 4.9}★`, label: `${config.ratingCount}+ Reviews` }
      : { value: '100%', label: 'Satisfaction Guarantee' },
    { value: `${config.serviceRadiusMiles}mi`, label: 'Service Radius' },
  ];
}

/** Common problems + solutions, biased by category and (optional) service. */
export function commonProblems(
  config: BusinessConfig,
  service?: ResolvedService,
): Array<{ problem: string; solution: string }> {
  const noun = (service?.name ?? config.category).toLowerCase();
  const base = [
    {
      problem: `Slow or recurring ${noun} issues`,
      solution: `We diagnose the root cause — not just the symptom — so the fix actually lasts.`,
    },
    {
      problem: 'Surprise pricing and hidden fees',
      solution: `You get a flat-rate quote approved before we start. The price we say is the price you pay.`,
    },
    {
      problem: 'Long waits for a callback',
      solution: `We answer fast and offer same-day scheduling, with 24/7 response for emergencies.`,
    },
    {
      problem: 'Work that fails inspection',
      solution: `Every job is completed to local code by licensed, insured technicians and backed by our guarantee.`,
    },
  ];
  // Rotate deterministically so pages differ.
  const start = Math.abs(hashSeed(noun)) % base.length;
  return [...base.slice(start), ...base.slice(0, start)];
}

export function emergencyCtaCopy(
  config: BusinessConfig,
  placeName: string,
): { title: string; description: string } {
  return {
    title: `${config.category} Emergency in ${placeName}?`,
    description: `Don't wait — ${config.name} offers 24/7 emergency response with fast arrival and upfront pricing. Call now and we'll be on the way.`,
  };
}

// --- Shared helpers ----------------------------------------------------------

/** "A, B and C" from a list. */
export function listToProse(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const copy = [...items];
  const last = copy.pop();
  return `${copy.join(', ')} and ${last}`;
}

/** Local, signed hash for rotation (kept private to this module). */
function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}
