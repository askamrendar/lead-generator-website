import {
  pageShell,
  heroSection,
  innerBanner,
  servicesGridSection,
  contentSection,
  ctaSmallSection,
  testimonialsSection,
  faqSection,
  ctaBottomSection,
  contactSection,
} from './sections.ts';
import { articleHtml } from '../article.ts';
import type { GeneratedPageContent } from '@/lib/ai/types';
import type { HtmlPack, PackChrome, PackPageMeta } from '../types';

/**
 * "Template 1" — the royal-oak pack behind the platform's pack contract.
 * Page compositions are moved VERBATIM from lib/htmlgen/engine.ts (which now
 * only enumerates routes/content and dispatches); output is byte-identical to
 * the pre-registry renderer apart from the pageShell's added OG/Twitter meta.
 * `PackChrome` is a structural superset of the sections' `TplChrome`.
 */

const reviewList = (c: GeneratedPageContent) =>
  c.reviews.map((r) => ({ text: r.body, author: r.author }));

function shell(
  c: PackChrome,
  m: PackPageMeta,
  body: string,
): string {
  return pageShell(c, {
    title: m.title,
    description: m.description,
    path: m.path,
    jsonLd: m.jsonLd,
    body,
  });
}

export const royalOakPack: HtmlPack = {
  id: 'template-1',
  displayName: 'Template 1',
  description: 'Classic contractor design — light theme, banner hero with quote form.',
  assetDir: 'royal-oak',
  defaultAssetsBase: '/templates/royal-oak/assets',
  render: {
    home(c, m, d) {
      return shell(c, m, [
        heroSection(c, {
          heading: d.content.heroHeading,
          copy: d.content.heroCopy,
          appOrigin: c.appOrigin,
        }),
        servicesGridSection(c, {
          heading: d.servicesHeading,
          sub: d.servicesSub,
          cards: d.serviceCards,
        }),
        contentSection(articleHtml(d.content, d.articleHeading)),
        ctaSmallSection(c, d.ctaLine),
        testimonialsSection(reviewList(d.content)),
        faqSection(d.content.faqs),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    about(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.heading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.content.heroHeading)),
        ctaSmallSection(c, d.ctaLine),
        testimonialsSection(reviewList(d.content)),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    contact(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.heading, d.sub),
        contactSection(c, { appOrigin: c.appOrigin, hours: c.hoursHtml }),
      ].join('\n'));
    },
    servicesIndex(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.heading, d.sub),
        servicesGridSection(c, { heading: d.gridHeading, sub: d.gridSub, cards: d.serviceCards }),
        testimonialsSection(reviewList(d.content)),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    servicePage(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.content.heroHeading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.articleHeading)),
        ctaSmallSection(c, d.ctaLine),
        faqSection(d.content.faqs),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    areasIndex(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.heading, d.sub),
        servicesGridSection(c, { heading: d.gridHeading, sub: d.gridSub, cards: d.areaCards }),
        testimonialsSection(reviewList(d.content)),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
    areaPage(c, m, d) {
      return shell(c, m, [
        innerBanner(c, d.heading, d.content.heroCopy),
        contentSection(articleHtml(d.content, d.articleHeading)),
        ctaSmallSection(c, d.ctaLine),
        faqSection(d.content.faqs),
        ctaBottomSection(c, { heading: d.content.cta.title, copy: d.content.cta.description }),
      ].join('\n'));
    },
  },
};
