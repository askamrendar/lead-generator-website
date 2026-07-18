import { test } from 'node:test';
import assert from 'node:assert/strict';
import { template2Pack } from '../templates/html/template-2/pack.ts';
import { pageShell as royalOakShell } from '../templates/html/royal-oak/sections.ts';

/**
 * Template 2 pack tests — pure string-builder assertions. The fixture business
 * is fictional ("Springfield") so we can also assert nothing from the design
 * reference (a New York drain-cleaning site) leaks into the markup.
 */

const services = (n) =>
  Array.from({ length: n }, (_, i) => ({
    label: `Service ${i + 1}`,
    href: `/services/service-${i + 1}`,
  }));

const areas = (n) =>
  Array.from({ length: n }, (_, i) => ({
    label: `Area ${i + 1}`,
    href: `/near-me/area-${i + 1}`,
  }));

const chrome = (over = {}) => ({
  name: 'Summit Home Services',
  phone: '(555) 010-0100',
  telHref: 'tel:+15550100100',
  email: 'hello@example.com',
  city: 'Springfield',
  stateAbbr: 'IL',
  addressLine: '1 Main St, Springfield, IL 62701',
  category: 'Home Services',
  tagline: 'Reliable local pros',
  origin: 'https://example.com',
  base: '',
  assets: '/templates/template-2/assets',
  appOrigin: 'https://app.example.com',
  services: services(3),
  areas: areas(2),
  primaryColor: 'hsl(220 80% 40%)',
  secondaryColor: 'hsl(35 90% 55%)',
  hoursHtml: 'Mon–Fri: 8 – 5',
  year: 2026,
  ...over,
});

const content = (over = {}) => ({
  seoTitle: 'Home | Summit',
  metaDescription: 'Trusted services in Springfield.',
  heroHeading: 'Fast, Friendly Local Service',
  heroCopy: 'Serving Springfield homes and businesses.',
  intro: 'We are a local company.',
  benefits: ['Fast response'],
  problems: [],
  whyChooseUs: ['Upfront pricing', 'Background-checked techs'],
  process: [{ title: 'Call', description: 'We schedule you fast.' }],
  stats: [{ value: '10+', label: 'Years in business' }],
  reviews: [{ author: 'Pat D.', rating: 5, body: 'Great work!' }],
  faqs: [{ question: 'Do you offer estimates?', answer: 'Yes, free ones.' }],
  relatedServices: [],
  relatedLocations: [],
  cta: { title: 'Ready to start?', description: 'Call today.' },
  imagePrompts: [],
  internalLinks: [],
  ...over,
});

const meta = (path = '/') => ({
  title: 'Page Title',
  description: 'Page description.',
  path,
  jsonLd: '{"@context":"https://schema.org"}',
});

function renderHome({ nServices = 3, nAreas = 2, c = {}, body = {} } = {}) {
  const ch = chrome({ services: services(nServices), areas: areas(nAreas), ...c });
  return template2Pack.render.home(ch, meta('/'), {
    content: content(body),
    serviceCards: services(nServices).map((s) => ({ ...s, blurb: `${s.label} blurb` })),
    areaCards: areas(nAreas).map((a) => ({ ...a, blurb: `${a.label} blurb` })),
    servicesHeading: 'Our Services',
    servicesSub: 'What we do',
    areasHeading: 'Areas We Serve',
    areasSub: 'Where we work',
    articleHeading: 'About our work',
    ctaLine: 'Call now',
  });
}

// --- Data-driven cardinality ------------------------------------------------

test('N services produce exactly N homepage cards (5 and 15)', () => {
  for (const n of [5, 15]) {
    const html = renderHome({ nServices: n });
    const cards = html.match(/href="\/services\/service-\d+"/g) ?? [];
    // Cards appear in the grid AND nav/footer links; count grid cards only.
    const gridCards = html.match(/class="card" href="\/services\/service-\d+"/g) ?? [];
    assert.equal(gridCards.length, n, `expected ${n} service cards`);
    assert.ok(cards.length >= n);
  }
});

test('N areas produce exactly N area cards', () => {
  const html = renderHome({ nAreas: 7 });
  const gridCards = html.match(/class="card" href="\/near-me\/area-\d+"/g) ?? [];
  assert.equal(gridCards.length, 7);
});

// --- Conditional sections ---------------------------------------------------

test('empty reviews/faqs/stats hide their sections entirely', () => {
  const html = renderHome({ body: { reviews: [], faqs: [], stats: [] } });
  assert.ok(!html.includes('What Customers Say'));
  assert.ok(!html.includes('Frequently Asked Questions'));
  assert.ok(!html.includes('trust-strip'));
});

test('no areas hides the areas grid, nav entry, and footer areas line', () => {
  const html = renderHome({ nAreas: 0 });
  assert.ok(!html.includes('Areas We Serve'));
  assert.ok(!html.includes('/near-me'));
});

// --- Navigation adaptation --------------------------------------------------

test('small service lists get a dropdown; large lists collapse to the index link', () => {
  const small = renderHome({ nServices: 3 });
  assert.ok(small.includes('has-drop'));
  const large = renderHome({ nServices: 15 });
  // Areas (2) still get a dropdown, but the 15-service menu must not.
  assert.ok(!large.includes(`<ul class="drop"><li><a href="/services/service-15"`));
});

// --- Lead form --------------------------------------------------------------

test('lead form posts to the platform /api/lead with honeypot + labeled fields', () => {
  const html = renderHome();
  assert.ok(html.includes('action="https://app.example.com/api/lead"'));
  assert.ok(html.includes('method="post"'));
  assert.ok(html.includes('name="company"'));
  for (const f of ['lead-name', 'lead-phone', 'lead-email']) {
    assert.ok(html.includes(`for="${f}"`), `label for ${f}`);
    assert.ok(html.includes(`id="${f}"`), `input id ${f}`);
  }
});

// --- SEO head ---------------------------------------------------------------

test('shell emits canonical, Open Graph, Twitter card, and JSON-LD', () => {
  const html = renderHome();
  assert.ok(html.includes('<link rel="canonical" href="https://example.com/">'));
  assert.ok(html.includes('property="og:title"'));
  assert.ok(html.includes('property="og:url" content="https://example.com/"'));
  assert.ok(html.includes('name="twitter:card"'));
  assert.ok(html.includes('application/ld+json'));
});

test('twitter card degrades to summary without an image and upgrades with one', () => {
  const none = renderHome();
  assert.ok(none.includes('content="summary"'));
  const withHero = renderHome({ c: { heroImage: 'https://img.example.com/h.jpg' } });
  assert.ok(withHero.includes('content="summary_large_image"'));
  assert.ok(withHero.includes('property="og:image"'));
});

// --- Escaping ---------------------------------------------------------------

test('user data is HTML-escaped everywhere it renders', () => {
  const html = renderHome({
    c: { name: 'A "B" & C <script>alert(1)</script>' },
  });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&quot;B&quot;'));
});

// --- Mobile / a11y chrome ---------------------------------------------------

test('sticky mobile call bar and skip link are present', () => {
  const html = renderHome();
  assert.ok(html.includes('mobile-call-bar'));
  assert.ok(html.includes('href="tel:+15550100100"'));
  assert.ok(html.includes('class="skip-link"'));
  assert.ok(html.includes('id="main"'));
});

// --- Originality ------------------------------------------------------------

test('no reference-site strings leak into the rendered output', () => {
  const html = renderHome();
  for (const leaked of ['Unclog', 'unclognyc', 'New York', 'NYC', 'Brooklyn', 'Manhattan', 'Queens']) {
    assert.ok(!html.includes(leaked), `found leaked reference string: ${leaked}`);
  }
});

// --- Export contract ---------------------------------------------------------

test('relative assets prefix produces href="assets/... (ZIP depth-rewrite contract)', () => {
  const html = renderHome({ c: { assets: 'assets' } });
  assert.ok(html.includes('href="assets/css/site.css"'));
  assert.ok(!html.includes('url(assets/'));
});

// --- Royal-oak (Template 1) regression ---------------------------------------

test('royal-oak pageShell now emits OG + Twitter meta', () => {
  const html = royalOakShell(
    {
      ...chrome(),
      assets: '/templates/royal-oak/assets',
    },
    { title: 'T', description: 'D', path: '/', body: '<p>x</p>' },
  );
  assert.ok(html.includes('property="og:title" content="T"'));
  assert.ok(html.includes('name="twitter:card"'));
  assert.ok(html.includes('<link rel="canonical" href="https://example.com/">'));
});
