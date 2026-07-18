import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPageOverride,
  parseContentOverrides,
  pageOverrideSchema,
} from '../lib/websites/content-overrides.ts';

const content = () => ({
  seoTitle: 'Gen Title',
  metaDescription: 'Gen description',
  heroHeading: 'Gen Hero',
  heroCopy: 'Gen copy',
  intro: 'Gen intro',
  benefits: ['Gen benefit'],
  problems: [],
  whyChooseUs: ['Gen why'],
  process: [{ title: 'Step', description: 'Desc' }],
  stats: [],
  reviews: [],
  faqs: [{ question: 'Gen Q', answer: 'Gen A' }],
  relatedServices: [],
  relatedLocations: [],
  cta: { title: 'Gen CTA', description: 'Gen CTA desc' },
  imagePrompts: [],
  internalLinks: [],
});

test('no override returns the original content object', () => {
  const c = content();
  assert.equal(applyPageOverride(c, undefined), c);
});

test('override replaces only the provided fields', () => {
  const merged = applyPageOverride(content(), { heroHeading: 'My Heading', seoTitle: 'My Title' });
  assert.equal(merged.heroHeading, 'My Heading');
  assert.equal(merged.seoTitle, 'My Title');
  assert.equal(merged.intro, 'Gen intro');
  assert.deepEqual(merged.faqs, [{ question: 'Gen Q', answer: 'Gen A' }]);
});

test('empty strings and empty arrays do NOT override generated content', () => {
  const merged = applyPageOverride(content(), { heroHeading: '   ', benefits: [] });
  assert.equal(merged.heroHeading, 'Gen Hero');
  assert.deepEqual(merged.benefits, ['Gen benefit']);
});

test('faqs and cta overrides replace the generated set', () => {
  const merged = applyPageOverride(content(), {
    faqs: [{ question: 'My Q', answer: 'My A' }],
    cta: { title: 'My CTA', description: 'My desc' },
  });
  assert.deepEqual(merged.faqs, [{ question: 'My Q', answer: 'My A' }]);
  assert.equal(merged.cta.title, 'My CTA');
});

test('parseContentOverrides is defensive: invalid input → {}', () => {
  assert.deepEqual(parseContentOverrides(null), {});
  assert.deepEqual(parseContentOverrides('junk'), {});
  assert.deepEqual(parseContentOverrides({ '/': { heroHeading: 42 } }), {});
  const good = { '/': { heroHeading: 'Hi' }, '/services/x': { intro: 'Yo' } };
  assert.deepEqual(parseContentOverrides(good), good);
});

test('schema rejects unknown/structural fields (platform stays owner)', () => {
  assert.equal(pageOverrideSchema.safeParse({ internalLinks: [] }).success, false);
  assert.equal(pageOverrideSchema.safeParse({ heroHeading: 'ok' }).success, true);
});
