import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripMarkdown,
  wordCount,
  readingTimeMin,
  makeExcerpt,
  buildSeo,
} from '../lib/blog/seo.ts';
import { CONTENT_TYPES, contentTypeLabel } from '../lib/blog/content-types.ts';

test('stripMarkdown removes markup', () => {
  assert.equal(stripMarkdown('# Title\n\n**bold** and [link](http://x)'), 'Title bold and link');
});

test('wordCount + readingTime', () => {
  assert.equal(wordCount('one two three four'), 4);
  assert.equal(wordCount(''), 0);
  assert.equal(readingTimeMin(0), 1); // min 1
  assert.equal(readingTimeMin(400), 2);
});

test('makeExcerpt truncates with ellipsis', () => {
  const long = 'word '.repeat(80);
  const ex = makeExcerpt(long, 50);
  assert.ok(ex.length <= 52);
  assert.ok(ex.endsWith('…'));
  assert.equal(makeExcerpt('short body'), 'short body');
});

test('buildSeo caps title + description', () => {
  const seo = buildSeo('T'.repeat(80), 'D'.repeat(200));
  assert.ok(seo.title.length <= 60);
  assert.ok(seo.description.length <= 160);
  assert.equal(seo.twitterCard, 'summary_large_image');
  assert.equal(seo.ogTitle.length, 80); // og keeps full title
});

test('content-type catalog covers 14 types + label lookup', () => {
  assert.equal(CONTENT_TYPES.length, 14);
  assert.equal(contentTypeLabel('FAQ'), 'FAQ Page');
  assert.equal(contentTypeLabel('UNKNOWN'), 'UNKNOWN');
});
