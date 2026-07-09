import { getServices, paths } from '@/lib/generator/config';
import {
  cityLinks,
  countyLinks,
  neighborhoodLinks,
  serviceCityLinks,
  serviceLinks,
  stateLinks,
  zipLinks,
  type LinkCluster,
} from '@/lib/generator/links';
import {
  commonProblems,
  countyIntro,
  countyMetaDescription,
  emergencyCtaCopy,
  homeHeroHeadline,
  homeHeroSubhead,
  locationIntro,
  locationMetaDescription,
  neighborhoodIntro,
  neighborhoodMetaDescription,
  serviceCityFaqs,
  serviceCityIntro,
  serviceCityMetaDescription,
  serviceFaqs,
  serviceIntro,
  serviceMetaDescription,
  serviceProcess,
  serviceBenefits,
  stateHubIntro,
  zipIntro,
  zipMetaDescription,
} from '@/lib/generator/content';
import { buildImagePrompts } from '@/lib/ai/services/image-prompts';
import type {
  Faq,
  GeneratedPageContent,
  GeneratedReview,
  LinkAnchor,
  PageContext,
  ProcessStep,
  Stat,
} from '@/lib/ai/types';
import { locationStats } from '@/lib/generator/content';

/**
 * Deterministic content builder — the offline fallback "provider".
 *
 * Reuses the Phase 1/2 content + link engines to assemble a complete
 * GeneratedPageContent for any page type. This is what the content service
 * returns whenever no live AI provider is configured (or an AI call fails), so
 * the site always renders great, unique copy with zero API keys.
 */

function linkClustersFor(ctx: PageContext): LinkCluster[] {
  switch (ctx.pageType) {
    case 'service':
      return ctx.service ? serviceLinks(ctx.business, ctx.service) : [];
    case 'city':
      return ctx.state && ctx.city
        ? cityLinks(ctx.business, ctx.state, ctx.city)
        : [];
    case 'serviceCity':
      return ctx.service && ctx.state && ctx.city
        ? serviceCityLinks(ctx.business, ctx.service, ctx.state, ctx.city)
        : [];
    case 'state':
      return ctx.state ? stateLinks(ctx.business, ctx.state) : [];
    case 'county':
      return ctx.county ? countyLinks(ctx.business, ctx.county) : [];
    case 'zip':
      return ctx.zip ? zipLinks(ctx.business, ctx.zip) : [];
    case 'neighborhood':
      return ctx.neighborhood
        ? neighborhoodLinks(ctx.business, ctx.neighborhood)
        : [];
    default:
      return [];
  }
}

function flatten(clusters: LinkCluster[]): LinkAnchor[] {
  return clusters.flatMap((c) =>
    c.links.map((l) => ({ label: l.label, href: l.href })),
  );
}

function genericProcess(): ProcessStep[] {
  return [
    { title: 'Contact Us', description: 'Call or request service online and we confirm a convenient time.' },
    { title: 'On-Site Assessment', description: 'A licensed pro inspects the issue and identifies the root cause.' },
    { title: 'Upfront Quote', description: 'You approve a clear, flat-rate price before any work begins.' },
    { title: 'Expert Service', description: 'We complete the work to code, test it, and leave the area clean.' },
  ];
}

function genericBenefits(placeName: string): string[] {
  return [
    'Upfront, flat-rate pricing — approved before we start',
    'Licensed, insured, and background-checked technicians',
    `Fast, local service across ${placeName}`,
    'Workmanship guarantee on every job',
    'On-time arrival windows and clean, respectful service',
  ];
}

function whyChooseUs(ctx: PageContext): string[] {
  if (ctx.business.guarantees.length) return ctx.business.guarantees;
  return [
    'Upfront pricing with no hidden fees',
    'Licensed, insured, and locally trusted',
    'Fast response and same-day availability',
    '100% satisfaction guarantee',
  ];
}

function reviews(ctx: PageContext): GeneratedReview[] {
  return ctx.business.reviews.map((r) => ({
    author: r.author,
    rating: r.rating,
    body: r.body,
    location: r.location,
  }));
}

function genericLocationFaqs(ctx: PageContext): Faq[] {
  const b = ctx.business;
  return [
    {
      question: `Do you provide ${b.category.toLowerCase()} in ${ctx.placeName}?`,
      answer: `Yes — ${b.name} serves ${ctx.placeName} and the surrounding area with fast, local scheduling and upfront pricing.`,
    },
    {
      question: 'How soon can you come out?',
      answer: `We offer same-day and next-day availability across ${ctx.placeName}, plus 24/7 emergency response for urgent issues.`,
    },
    {
      question: 'Are you licensed and insured?',
      answer: `Absolutely. ${b.name} is fully licensed and insured${
        b.licenseNumber ? ` (License ${b.licenseNumber})` : ''
      }, and every technician is background-checked.`,
    },
    {
      question: 'Do you offer free quotes?',
      answer: 'Yes. You get an upfront, flat-rate quote before any work begins — no obligation, no surprises.',
    },
  ];
}

function stats(ctx: PageContext): Stat[] {
  return locationStats(ctx.business, ctx.placeName.split(',')[0] ?? ctx.placeName);
}

function baseCta(ctx: PageContext) {
  return {
    title: `Ready to Get Started with ${ctx.business.name}?`,
    description: `Call ${ctx.business.phone} for fast scheduling and an upfront quote in ${ctx.placeName}.`,
  };
}

/** Assemble the full deterministic content object for a page. */
export function deterministicContent(ctx: PageContext): GeneratedPageContent {
  const b = ctx.business;
  const clusters = linkClustersFor(ctx);
  const internalLinks = flatten(clusters);
  const relatedServices = getServices(b)
    .slice(0, 6)
    .map((s) => ({ label: s.name, href: paths.service(s.slug) }));
  const relatedLocations = internalLinks
    .filter((l) => l.href.startsWith('/locations'))
    .slice(0, 8);
  const imagePrompts = buildImagePrompts(ctx);

  // Fields that vary by page type.
  let seoTitle: string;
  let metaDescription: string;
  let heroHeading: string;
  let heroCopy: string;
  let intro: string;
  let locationIntroText: string | undefined;
  let faqs: Faq[];
  let benefits: string[];
  let process: ProcessStep[];
  let emergency: { title: string; description: string } | undefined;

  const problems = commonProblems(b, ctx.service);

  switch (ctx.pageType) {
    case 'service': {
      const s = ctx.service!;
      seoTitle = `${s.name} in ${b.address.city}`;
      metaDescription = serviceMetaDescription(b, s);
      heroHeading = `${s.name} in ${b.address.city}`;
      heroCopy = s.shortDescription;
      intro = serviceIntro(b, s);
      faqs = serviceFaqs(b, s);
      benefits = serviceBenefits(b, s);
      process = serviceProcess(s);
      emergency = s.emergency ? emergencyCtaCopy(b, b.address.city) : undefined;
      break;
    }
    case 'serviceCity': {
      const s = ctx.service!;
      const c = ctx.city!;
      seoTitle = `${s.name} in ${c.name}, ${ctx.state!.abbr}`;
      metaDescription = serviceCityMetaDescription(b, s, c, ctx.state!.abbr);
      heroHeading = `${s.name} in ${c.name}, ${ctx.state!.abbr}`;
      heroCopy = s.shortDescription;
      intro = serviceCityIntro(b, s, c);
      locationIntroText = locationIntro(b, c);
      faqs = serviceCityFaqs(b, s, c);
      benefits = serviceBenefits(b, s);
      process = serviceProcess(s);
      emergency = emergencyCtaCopy(b, c.name);
      break;
    }
    case 'city': {
      const c = ctx.city!;
      seoTitle = `${b.primaryService} in ${c.name}, ${ctx.state!.abbr}`;
      metaDescription = locationMetaDescription(b, c);
      heroHeading = `${b.primaryService} in ${c.name}, ${ctx.state!.abbr}`;
      heroCopy = `${b.name} — ${b.tagline}`;
      intro = locationIntro(b, c);
      locationIntroText = intro;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(ctx.placeName);
      process = genericProcess();
      emergency = emergencyCtaCopy(b, c.name);
      break;
    }
    case 'state': {
      const st = ctx.state!;
      seoTitle = `${b.category} in ${st.name}`;
      metaDescription = `${b.name} serves cities and counties across ${st.name} with licensed, guaranteed ${b.category.toLowerCase()}. Call ${b.phone}.`.slice(0, 155);
      heroHeading = `${b.category} Across ${st.name}`;
      heroCopy = `${b.name} — ${b.tagline}`;
      intro = stateHubIntro(b, st);
      locationIntroText = intro;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(st.name);
      process = genericProcess();
      emergency = undefined;
      break;
    }
    case 'county': {
      const county = ctx.county!;
      seoTitle = `${b.primaryService} in ${county.name}`;
      metaDescription = countyMetaDescription(b, county);
      heroHeading = `${b.category} in ${county.name}`;
      heroCopy = `${b.name} — ${b.tagline}`;
      intro = countyIntro(b, county);
      locationIntroText = intro;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(county.name);
      process = genericProcess();
      emergency = emergencyCtaCopy(b, county.name);
      break;
    }
    case 'neighborhood': {
      const n = ctx.neighborhood!;
      seoTitle = `${b.primaryService} in ${n.name}, ${n.city.name}`;
      metaDescription = neighborhoodMetaDescription(b, n);
      heroHeading = `${b.primaryService} in ${n.name}`;
      heroCopy = `${b.name} — ${b.tagline}`;
      intro = neighborhoodIntro(b, n);
      locationIntroText = intro;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(n.name);
      process = genericProcess();
      emergency = emergencyCtaCopy(b, n.name);
      break;
    }
    case 'zip': {
      const z = ctx.zip!;
      seoTitle = `${b.primaryService} in ${z.zip} — ${z.city.name}`;
      metaDescription = zipMetaDescription(b, z);
      heroHeading = `${b.primaryService} in ${z.zip}`;
      heroCopy = `${b.name} — ${b.tagline}`;
      intro = zipIntro(b, z);
      locationIntroText = intro;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(z.city.name);
      process = genericProcess();
      emergency = emergencyCtaCopy(b, z.city.name);
      break;
    }
    case 'about': {
      seoTitle = `About ${b.name}`;
      metaDescription = `${b.description}`.slice(0, 155);
      heroHeading = `About ${b.name}`;
      heroCopy = b.tagline;
      intro = b.description;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(ctx.placeName);
      process = genericProcess();
      emergency = undefined;
      break;
    }
    case 'home':
    default: {
      seoTitle = `${b.name} | ${b.tagline}`;
      metaDescription = `${b.description}`.slice(0, 155);
      heroHeading = homeHeroHeadline(b);
      heroCopy = homeHeroSubhead(b);
      intro = b.description;
      faqs = genericLocationFaqs(ctx);
      benefits = genericBenefits(ctx.placeName);
      process = genericProcess();
      emergency = emergencyCtaCopy(b, b.address.city);
      break;
    }
  }

  return {
    seoTitle,
    metaDescription,
    heroHeading,
    heroCopy,
    intro,
    benefits,
    problems,
    whyChooseUs: whyChooseUs(ctx),
    process,
    emergency,
    locationIntro: locationIntroText,
    stats: stats(ctx),
    reviews: reviews(ctx),
    faqs,
    relatedServices,
    relatedLocations,
    cta: baseCta(ctx),
    imagePrompts,
    internalLinks,
  };
}
