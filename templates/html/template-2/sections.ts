/**
 * "Template 2" — original modern local-service design (dark navy surfaces,
 * brand accent, hero with quote form, trust badges, card grids, sticky mobile
 * call bar). Structurally inspired by contemporary emergency-service sites;
 * every string of copy, every color role, and every page count comes from the
 * platform's data — nothing here is tied to any business or industry.
 *
 * Constraints honored by design:
 *  - ZERO external resources (the app's CSP allows only 'self'): one local
 *    stylesheet, system font stack, inline SVG icons, no iframes, no JS.
 *  - Sections render '' when their data is empty — no empty placeholders.
 *  - Navigation adapts: small service/area lists get CSS-only dropdowns,
 *    large lists collapse to their index pages (no overflowing menus).
 *  - Asset refs use `${assets}` inside href="/src=" attributes only, so the
 *    ZIP exporter's depth-relative rewrite applies cleanly.
 */

import type { PackChrome, PackCard, TplLink } from '../types';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Dropdowns stay usable up to this many entries; beyond it, link to the index. */
const NAV_DROPDOWN_MAX = 8;

// ---------------------------------------------------------------------------
// Inline SVG icons (stroke = currentColor so CSS themes them)
// ---------------------------------------------------------------------------

const ICON = {
  phone:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  shield:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  clock:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pin:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  check:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  tool:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  star:
    '<svg class="ic ic-star" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
} as const;

const FIVE_STARS = `<span class="stars" role="img" aria-label="5 out of 5 stars">${ICON.star.repeat(5)}</span>`;

// ---------------------------------------------------------------------------
// Document shell (head + utility bar + header + footer + mobile call bar)
// ---------------------------------------------------------------------------

function navDrop(label: string, indexHref: string, items: TplLink[], base: string): string {
  if (items.length === 0 || items.length > NAV_DROPDOWN_MAX) {
    return `<li><a href="${base}${indexHref}">${esc(label)}</a></li>`;
  }
  const links = items
    .map((i) => `<li><a href="${base}${i.href}">${esc(i.label)}</a></li>`)
    .join('');
  return `<li class="has-drop"><a href="${base}${indexHref}">${esc(label)}</a>
            <ul class="drop">${links}</ul>
          </li>`;
}

export function pageShell(
  c: PackChrome,
  page: { title: string; description: string; path: string; jsonLd?: string; body: string },
): string {
  const canonical = `${c.origin}${page.path === '/' ? '/' : page.path}`;
  const socialImage = c.heroImage ?? c.logoUrl;
  const favicon = c.logoUrl
    ? `<link rel="icon" href="${esc(c.logoUrl)}">`
    : `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='11' fill='%230e1726'/%3E%3Ctext x='12' y='17' font-size='13' text-anchor='middle' fill='white' font-family='sans-serif'%3E${encodeURIComponent(c.name.charAt(0).toUpperCase())}%3C/text%3E%3C/svg%3E">`;
  const logo = c.logoUrl
    ? `<img src="${esc(c.logoUrl)}" alt="${esc(c.name)}" class="logo-img">`
    : `<span class="logo-text">${esc(c.name)}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(c.name)}">
    <meta property="og:title" content="${esc(page.title)}">
    <meta property="og:description" content="${esc(page.description)}">
    <meta property="og:url" content="${canonical}">
    ${socialImage ? `<meta property="og:image" content="${esc(socialImage)}">` : ''}
    <meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${esc(page.title)}">
    <meta name="twitter:description" content="${esc(page.description)}">
    ${socialImage ? `<meta name="twitter:image" content="${esc(socialImage)}">` : ''}
    ${favicon}
    <link rel="stylesheet" href="${c.assets}/css/site.css">
    <style>:root{--primary:${c.primaryColor};--accent:${c.secondaryColor}}</style>
    ${page.jsonLd ? `<script type="application/ld+json">${page.jsonLd}</script>` : ''}
</head>
<body class="t2">
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="utility-bar">
        <div class="container utility-inner">
            <p class="utility-note">${ICON.pin} Serving ${esc(c.city)}, ${esc(c.stateAbbr)} &middot; 24/7 Emergency Service</p>
            <a class="utility-phone" href="${c.telHref}">${ICON.phone} <strong>${esc(c.phone)}</strong></a>
        </div>
    </div>
    <header class="site-header">
        <div class="container header-inner">
            <a class="brand" href="${c.base}/">${logo}</a>
            <input type="checkbox" id="nav-toggle" class="nav-toggle">
            <label for="nav-toggle" class="nav-toggle-btn" aria-label="Menu"><span></span><span></span><span></span></label>
            <nav class="main-nav" aria-label="Main">
                <ul>
                    <li><a href="${c.base}/">Home</a></li>
                    ${navDrop('Services', '/services', c.services, c.base)}
                    ${c.areas.length > 0 ? navDrop('Areas We Serve', '/near-me', c.areas, c.base) : ''}
                    <li><a href="${c.base}/about-us">About</a></li>
                    <li><a href="${c.base}/contact-us">Contact</a></li>
                    <li class="nav-cta"><a class="btn btn-accent" href="${c.telHref}">${ICON.phone} Call ${esc(c.phone)}</a></li>
                </ul>
            </nav>
        </div>
    </header>
    <main id="main">
${page.body}
    </main>
${footerSection(c)}
    <a class="mobile-call-bar" href="${c.telHref}">${ICON.phone} Call Now &middot; ${esc(c.phone)}</a>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Lead form (posts to the platform's /api/lead — JSON-free, no-JS)
// ---------------------------------------------------------------------------

export function leadForm(c: PackChrome): string {
  const options = c.services
    .map((s) => `<option value="${esc(s.label)}">${esc(s.label)}</option>`)
    .join('');
  return `<div class="lead-card">
    <h3 class="lead-title">Request a Free Quote</h3>
    <p class="lead-sub">Fast response &middot; no obligation</p>
    <form action="${c.appOrigin}/api/lead" method="post">
        <label for="lead-name">Name</label>
        <input id="lead-name" name="name" required minlength="2" autocomplete="name" placeholder="Your name">
        <label for="lead-phone">Phone</label>
        <input id="lead-phone" name="phone" type="tel" required minlength="7" autocomplete="tel" placeholder="Your phone">
        <label for="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" required autocomplete="email" placeholder="you@email.com">
        ${c.services.length > 0 ? `<label for="lead-service">Service needed</label>
        <select id="lead-service" name="service"><option value="">Select a service…</option>${options}</select>` : ''}
        <div class="hp-field" aria-hidden="true"><label for="lead-company">Company</label><input id="lead-company" name="company" tabindex="-1" autocomplete="off"></div>
        <button type="submit" class="btn btn-accent btn-block">Get My Free Quote</button>
    </form>
</div>`;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/** Home hero: headline + copy + trust badges + phone CTA, quote form beside. */
export function heroSection(c: PackChrome, opts: { heading: string; copy: string }): string {
  const bg = c.heroImage
    ? ` style="background-image:linear-gradient(rgba(10,17,32,.82),rgba(10,17,32,.88)),url(${esc(c.heroImage)})"`
    : '';
  return `    <section class="hero"${bg}>
        <div class="container hero-inner">
            <div class="hero-text">
                <h1>${esc(opts.heading)}</h1>
                <p class="hero-copy">${esc(opts.copy)}</p>
                <ul class="badge-row">
                    <li>${ICON.shield} Licensed &amp; Insured</li>
                    <li>${ICON.clock} 24/7 Emergency</li>
                    <li>${ICON.pin} Locally Owned</li>
                </ul>
                <div class="hero-cta">
                    <a class="btn btn-accent btn-lg" href="${c.telHref}">${ICON.phone} ${esc(c.phone)}</a>
                    <a class="btn btn-ghost btn-lg" href="${c.base}/services">Our Services</a>
                </div>
            </div>
            <div class="hero-form">${leadForm(c)}</div>
        </div>
    </section>`;
}

/** Compact page header for inner pages. */
export function innerHero(c: PackChrome, heading: string, sub: string): string {
  return `    <section class="inner-hero">
        <div class="container">
            <h1>${esc(heading)}</h1>
            ${sub ? `<p>${esc(sub)}</p>` : ''}
        </div>
    </section>`;
}

/** Stats band — hidden entirely when no stats exist. */
export function trustStripSection(stats: Array<{ label: string; value: string }>): string {
  if (stats.length === 0) return '';
  const items = stats
    .map((s) => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`)
    .join('');
  return `    <section class="trust-strip" aria-label="Highlights">
        <div class="container"><ul class="trust-list">${items}</ul></div>
    </section>`;
}

/** Card grid shared by services and areas — one card per data item. */
export function cardsGridSection(
  c: PackChrome,
  opts: { heading: string; sub: string; cards: PackCard[]; icon?: 'tool' | 'pin' },
): string {
  if (opts.cards.length === 0) return '';
  const icon = ICON[opts.icon ?? 'tool'];
  const cards = opts.cards
    .map(
      (card) => `            <a class="card" href="${c.base}${card.href}">
                <span class="card-icon">${icon}</span>
                <h3>${esc(card.label)}</h3>
                <p>${esc(card.blurb)}</p>
                <span class="card-more">Learn more →</span>
            </a>`,
    )
    .join('\n');
  return `    <section class="section">
        <div class="container">
            <h2 class="section-title">${esc(opts.heading)}</h2>
            <p class="section-sub">${esc(opts.sub)}</p>
            <div class="card-grid">
${cards}
            </div>
        </div>
    </section>`;
}

/** Why-us checklist band — hidden when there is nothing to list. */
export function whyUsSection(c: PackChrome, opts: { heading: string; points: string[] }): string {
  if (opts.points.length === 0) return '';
  const items = opts.points.map((p) => `<li>${ICON.check} ${esc(p)}</li>`).join('');
  return `    <section class="section section-dark">
        <div class="container why-inner">
            <div>
                <h2 class="section-title">${esc(opts.heading)}</h2>
                <ul class="check-list">${items}</ul>
            </div>
            <div class="why-cta">
                <p class="why-phone-label">One call does it all</p>
                <a class="btn btn-accent btn-lg" href="${c.telHref}">${ICON.phone} ${esc(c.phone)}</a>
            </div>
        </div>
    </section>`;
}

/** Long-form article body wrapper (platform supplies the trusted HTML). */
export function contentSection(html: string): string {
  return `    <section class="section">
        <div class="container prose">
${html}
        </div>
    </section>`;
}

/** Static review cards — hidden when no reviews exist. */
export function reviewsSection(reviews: Array<{ text: string; author: string }>): string {
  if (reviews.length === 0) return '';
  const cards = reviews
    .map(
      (r) => `            <blockquote class="review-card">
                ${FIVE_STARS}
                <p>${esc(r.text)}</p>
                <footer>— ${esc(r.author)}</footer>
            </blockquote>`,
    )
    .join('\n');
  return `    <section class="section section-tint">
        <div class="container">
            <h2 class="section-title">What Customers Say</h2>
            <div class="review-grid">
${cards}
            </div>
        </div>
    </section>`;
}

/** FAQ accordion (native details/summary) — hidden when no FAQs exist. */
export function faqSection(faqs: Array<{ question: string; answer: string }>): string {
  if (faqs.length === 0) return '';
  const items = faqs
    .map(
      (f) => `            <details class="faq-item">
                <summary>${esc(f.question)}</summary>
                <p>${esc(f.answer)}</p>
            </details>`,
    )
    .join('\n');
  return `    <section class="section">
        <div class="container faq-wrap">
            <h2 class="section-title">Frequently Asked Questions</h2>
${items}
        </div>
    </section>`;
}

/** Full-width accent CTA band. */
export function ctaBandSection(c: PackChrome, opts: { heading: string; copy: string }): string {
  return `    <section class="cta-band">
        <div class="container cta-inner">
            <div>
                <h2>${esc(opts.heading)}</h2>
                <p>${esc(opts.copy)}</p>
            </div>
            <a class="btn btn-dark btn-lg" href="${c.telHref}">${ICON.phone} Call ${esc(c.phone)}</a>
        </div>
    </section>`;
}

/** Contact page body: info card + hours + quote form (no external map — CSP). */
export function contactSection(c: PackChrome): string {
  return `    <section class="section">
        <div class="container contact-grid">
            <div class="contact-info">
                <h2 class="section-title">Contact Information</h2>
                <p>${ICON.pin} <strong>${esc(c.name)}</strong><br>${esc(c.addressLine)}</p>
                <p>${ICON.phone} <a href="${c.telHref}">${esc(c.phone)}</a><br>
                   <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
                <h3>Office Hours</h3>
                <p>${c.hoursHtml}</p>
            </div>
            <div class="contact-form">${leadForm(c)}</div>
        </div>
    </section>`;
}

/** Footer: brand + services + quick links + contact, then areas + copyright. */
export function footerSection(c: PackChrome): string {
  const list = (items: TplLink[]) =>
    items.map((i) => `<li><a href="${c.base}${i.href}">${esc(i.label)}</a></li>`).join('');
  const areaLinks = c.areas
    .map((a) => `<a href="${c.base}${a.href}">${esc(a.label)}</a>`)
    .join(' &middot; ');
  return `    <footer class="site-footer">
        <div class="container footer-cols">
            <div>
                ${c.logoUrl ? `<img src="${esc(c.logoUrl)}" alt="${esc(c.name)}" class="logo-img">` : `<p class="logo-text">${esc(c.name)}</p>`}
                <p>${esc(c.tagline)}</p>
                <ul class="badge-row badge-row-sm">
                    <li>${ICON.shield} Licensed &amp; Insured</li>
                    <li>${ICON.clock} 24/7 Emergency</li>
                </ul>
            </div>
            ${c.services.length > 0 ? `<nav aria-label="Services"><h3>Our Services</h3><ul>${list(c.services)}</ul></nav>` : ''}
            <nav aria-label="Quick links"><h3>Quick Links</h3>
                <ul>
                    <li><a href="${c.base}/">Home</a></li>
                    <li><a href="${c.base}/services">Our Services</a></li>
                    ${c.areas.length > 0 ? `<li><a href="${c.base}/near-me">Areas We Serve</a></li>` : ''}
                    <li><a href="${c.base}/about-us">About Us</a></li>
                    <li><a href="${c.base}/contact-us">Contact Us</a></li>
                </ul>
            </nav>
            <div>
                <h3>Contact</h3>
                <p>${esc(c.addressLine)}</p>
                <p><a href="${c.telHref}">${esc(c.phone)}</a><br><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
            </div>
        </div>
        ${c.areas.length > 0 ? `<div class="container footer-areas"><p><strong>Serving:</strong> ${areaLinks}</p></div>` : ''}
        <div class="footer-bar">
            <div class="container"><p>&copy; ${c.year} ${esc(c.name)}. All rights reserved.</p></div>
        </div>
    </footer>`;
}
