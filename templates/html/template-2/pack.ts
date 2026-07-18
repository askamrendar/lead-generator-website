import {
  pageShell,
  heroSection,
  innerHero,
  trustStripSection,
  cardsGridSection,
  whyUsSection,
  contentSection,
  reviewsSection,
  faqSection,
  ctaBandSection,
  contactSection,
} from './sections.ts';
import { articleHtml } from '../article.ts';
import type { GeneratedPageContent } from '@/lib/ai/types';
import type { HtmlPack, PackChrome, PackPageMeta } from '../types';

/**
 * "Template 2" pack — modern dark design. Compositions only; every section
 * hides itself when its data is empty, so any industry/data combination
 * renders cleanly (no placeholders).
 */

const reviewList = (c: GeneratedPageContent) =>
  c.reviews.map((r) => ({ text: r.body, author: r.author }));

/** Why-us points: whyChooseUs first, benefits as fallback enrichment. */
const whyPoints = (c: GeneratedPageContent) =>
  c.whyChooseUs.length > 0 ? c.whyChooseUs : c.benefits;

function shell(c: PackChrome, m: PackPageMeta, body: string): string {
  return pageShell(c, {
    title: m.title,
    description: m.description,
    path: m.path,
    jsonLd: m.jsonLd,
    body,
  });
}

export const template2Pack: HtmlPack = {
  id: 'template-2',
  displayName: 'Template 2',
  description: 'Modern emergency-service design — dark theme, trust badges, sticky call bar.',
  assetDir: 'template-2',
  defaultAssetsBase: '/templates/template-2/assets',
  render: {
    home(c, m, d) {
      return shell(c, m, [
        heroSection(c, { heading: d.content.heroHeading, copy: d.content.heroCopy }),
        trustStripSection(d.content.stats),
        cardsGridSection(c, {
          heading: d.servicesHeading,
          sub: d.servicesSub,
          cards: d.serviceCards,
          icon: 'tool',
        }),
        whyUsSection(c, { heading: 'Why Choose Us', points: whyPoints(d.content) }),
        contentSection(articleHtml(d.content, d.articleHeading)),
        cardsGridSection(c, {
          heading: d.areasHeading,
          sub: d.areasSub,
          cards: d.areaCards,
          icon: 'pin',
        }),
        reviewsSection(reviewList(d.content)),
        faqSection(d.content.faqs),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    about(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.heading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.content.heroHeading)),
        reviewsSection(reviewList(d.content)),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    contact(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.heading, d.sub),
        contactSection(c),
      ].join('\n'));
    },
    servicesIndex(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.heading, d.sub),
        cardsGridSection(c, { heading: d.gridHeading, sub: d.gridSub, cards: d.serviceCards, icon: 'tool' }),
        reviewsSection(reviewList(d.content)),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    servicePage(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.content.heroHeading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.articleHeading)),
        faqSection(d.content.faqs),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    areasIndex(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.heading, d.sub),
        cardsGridSection(c, { heading: d.gridHeading, sub: d.gridSub, cards: d.areaCards, icon: 'pin' }),
        reviewsSection(reviewList(d.content)),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    areaPage(c, m, d) {
      return shell(c, m, [
        innerHero(c, d.heading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.articleHeading)),
        faqSection(d.content.faqs),
        ctaBandSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
  },
};
