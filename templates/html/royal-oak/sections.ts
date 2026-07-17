/**
 * "Royal Oak" HTML template — section-by-section port of the
 * royaloakmoldremoval.com static site (Bootstrap 3 + Poppins/Roboto theme).
 * Every section is a pure string-builder fed from the generator's own
 * BusinessConfig + AI/deterministic page content — no hardcoded business data.
 *
 * Assets ship in `public/templates/royal-oak/assets` (css/js/fonts/images from
 * the original bundle) and are referenced via `${assets}` so the same markup
 * serves hosted pages (absolute `/templates/royal-oak/assets`) and ZIP exports
 * (relative `assets`).
 *
 * The original's third-party lead iframe (leadsmartinc) is replaced by a plain
 * <form> posting to the app's own `/api/lead` — no external dependency.
 */

export interface TplLink {
  label: string;
  href: string;
}

export interface TplChrome {
  /** Business display name (header/footer logo text). */
  name: string;
  phone: string;
  telHref: string;
  email: string;
  city: string;
  stateAbbr: string;
  addressLine: string;
  /** Absolute canonical origin for this site (custom domain or app /sites url). */
  origin: string;
  /** Prefix for internal links: '' at domain root, '/sites/<id>' inside the app. */
  base: string;
  /** Prefix for asset URLs. */
  assets: string;
  services: TplLink[];
  areas: TplLink[];
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  /** Hero/banner background image URL (falls back to a brand-color gradient). */
  heroImage?: string;
  year: number;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function navList(items: TplLink[], base: string): string {
  return items.map((s) => `<li><a href="${base}${s.href}">${esc(s.label)}</a></li>`).join('');
}

// ---------------------------------------------------------------------------
// Document shell (head + header + footer) — mirrors the original chrome
// ---------------------------------------------------------------------------

export function pageShell(c: TplChrome, page: {
  title: string;
  description: string;
  path: string;
  h1ForLogoAlt?: string;
  jsonLd?: string;
  body: string;
}): string {
  const canonical = `${c.origin}${page.path === '/' ? '/' : page.path}`;
  const logo = c.logoUrl
    ? `<img src="${c.logoUrl}" alt="${esc(c.name)}" style="max-height:56px">`
    : `<span class="site-logo-text" style="font-family:Poppins,sans-serif;font-weight:700;font-size:22px;color:#373e45">${esc(c.name)}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}">
    <link rel="canonical" href="${canonical}">
    ${c.logoUrl ? `<link rel="icon" href="${c.logoUrl}">` : `<link rel="icon" href="${c.assets}/image/arrow-next-g.png">`}
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
    <link rel="stylesheet" href="${c.assets}/css/vendor.bundle.css">
    <link rel="stylesheet" href="${c.assets}/css/style.css">
    <link rel="stylesheet" href="${c.assets}/css/blog.css">
    <style>
        :root {
            --primary-color: ${c.primaryColor};
            --secondary-color: ${c.secondaryColor};
        }
        .site-logo-text{display:inline-block;line-height:1.2;padding:14px 0}
        .banner-intro .imagebg-fallback{position:absolute;inset:0;background:linear-gradient(135deg,var(--primary-color),var(--secondary-color))}
        .lead-form-wrapper form{background:#fff;border-radius:6px;padding:18px}
        .lead-form-wrapper label{display:block;font-size:13px;font-weight:600;margin:8px 0 4px;color:#373e45}
        .lead-form-wrapper input,.lead-form-wrapper select,.lead-form-wrapper textarea{width:100%;border:1px solid #dde3ea;border-radius:4px;padding:9px 12px;font-size:14px}
        .lead-form-wrapper button{margin-top:14px;width:100%;background:var(--primary-color);color:#fff;border:0;border-radius:4px;padding:12px;font-weight:600;font-size:15px;cursor:pointer}
        .lead-form-wrapper button:hover{background:var(--secondary-color)}
    </style>
    ${page.jsonLd ? `<script type="application/ld+json">${page.jsonLd}</script>` : ''}
</head>
<body class="theme-royal-oak">
    <header class="site-header header-s1 is-sticky">
        <div class="navbar navbar-primary">
            <div class="container">
                <div class="header-top">
                    <a class="navbar-brand" href="${c.base}/">${logo}</a>
                    <ul class="top-nav">
                        <li class="quote-btn"><span>CALL OFFICE #</span> <a href="${c.telHref}"><strong>${esc(c.phone)}</strong></a></li>
                    </ul>
                </div>
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#mainnav" aria-expanded="false">
                        <span class="sr-only">Menu</span>
                        <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
                    </button>
                    <div class="quote-btn"><a href="${c.telHref}"><span>Request Service</span></a></div>
                </div>
                <nav class="navbar-collapse collapse" id="mainnav">
                    <ul class="nav navbar-nav">
                        <li><a href="${c.base}/">Home</a></li>
                        <li>
                            <a href="${c.base}/services">Our Services</a>
                            <ul>${navList(c.services, c.base)}</ul>
                        </li>
                        <li>
                            <a href="${c.base}/near-me">Areas We Serve</a>
                            <ul>${navList(c.areas, c.base)}</ul>
                        </li>
                        <li><a href="${c.base}/about-us">About Us</a></li>
                        <li><a href="${c.base}/contact-us">Contact Us</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>
    <main>
${page.body}
    </main>
${footerSection(c)}
    <script src="${c.assets}/js/jquery.bundle.js"></script>
    <script src="${c.assets}/js/script.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function bannerBg(c: TplChrome): string {
  if (c.heroImage) {
    return `<div class="imagebg bg-image-loaded" style="background-image: url(${c.heroImage})">
            <img src="${c.heroImage}" alt="${esc(c.name)}" class="bg-image-loaded">
        </div>`;
  }
  return `<div class="imagebg-fallback"></div>`;
}

/** Plain lead form (replaces the original's third-party iframe). */
export function leadForm(c: TplChrome, appOrigin: string): string {
  const options = c.services
    .map((s) => `<option value="${esc(s.label)}">${esc(s.label)}</option>`)
    .join('');
  return `<div class="lead-form-wrapper">
    <div class="form-header">
        <h3 class="form-title">Get Free Quote</h3>
        <p class="form-subtitle">Fill out the form below for a fast, no-obligation estimate</p>
    </div>
    <form action="${appOrigin}/api/lead" method="post">
        <label for="lead-name">Name</label>
        <input id="lead-name" name="name" required minlength="2" placeholder="Your name">
        <label for="lead-phone">Phone</label>
        <input id="lead-phone" name="phone" type="tel" required minlength="7" placeholder="Your phone">
        <label for="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" required placeholder="you@email.com">
        <label for="lead-service">Service needed</label>
        <select id="lead-service" name="service"><option value="">Select a service…</option>${options}</select>
        <div aria-hidden="true" style="position:absolute;left:-9999px"><label for="lead-company">Company</label><input id="lead-company" name="company" tabindex="-1" autocomplete="off"></div>
        <button type="submit">Request Free Quote</button>
    </form>
</div>`;
}

/** Home hero: headline + copy + CTA buttons + quote form (original banner-intro). */
export function heroSection(c: TplChrome, opts: {
  heading: string;
  copy: string;
  appOrigin: string;
}): string {
  return `    <!-- Banner -->
    <div class="banner banner-static banner-intro">
        ${bannerBg(c)}
        <div class="container">
            <div class="content row">
                <div class="banner-text style-modern al-left pos-left light col-md-7 col-lg-8">
                    <h1 class="page-title">${esc(opts.heading)}</h1>
                    <p>${esc(opts.copy)}</p>
                    <div class="banner-cta">
                        <a class="btn btn-primary" href="${c.base}/services">Our Services</a>
                        <a class="btn btn-alt" href="${c.telHref}">${esc(c.phone)}</a>
                    </div>
                </div>
                <div class="col-md-5 col-lg-4 banner-form-container desktop-only">${leadForm(c, opts.appOrigin)}</div>
                <div class="banner-form-container mobile-only">${leadForm(c, opts.appOrigin)}</div>
            </div>
        </div>
    </div>`;
}

/** Inner-page banner (original banner-static on subpages). */
export function innerBanner(c: TplChrome, heading: string, sub: string): string {
  return `    <!-- Banner -->
    <div class="banner banner-static banner-intro">
        ${bannerBg(c)}
        <div class="container">
            <div class="content row">
                <div class="banner-text style-modern al-left pos-left light">
                    <h1 class="page-title">${esc(heading)}</h1>
                    <p>${esc(sub)}</p>
                </div>
            </div>
        </div>
    </div>`;
}

/** Services grid (original feature feature-s6 boxed cards). */
export function servicesGridSection(c: TplChrome, opts: {
  heading: string;
  sub: string;
  cards: Array<{ label: string; href: string; blurb: string }>;
}): string {
  const cards = opts.cards
    .map(
      (card) => `
          <div class="col-md-4 col-sm-4">
            <div class="feature feature-s6 boxed">
              <a href="${c.base}${card.href}">
                <div class="fbox-content">
                  <h3>${esc(card.label)}</h3>
                  <p>${esc(card.blurb)}</p>
                </div>
              </a>
            </div>
          </div>`,
    )
    .join('\n');
  return `    <div class="section section-services section-pad">
      <div class="container">
        <div class="content row">
          <h2 class="text-center">${esc(opts.heading)}</h2>
          <p class="text-center">${esc(opts.sub)}</p>
          <div class="row row-feature row-column">
${cards}
          </div>
        </div>
      </div>
    </div>`;
}

/** Long-form content section (original section-content bg-light). */
export function contentSection(html: string): string {
  return `    <!-- Content -->
    <div class="section section-content section-pad bg-light">
        <div class="container">
            <div class="content row">
                <div class="row">
                    <div class="col-md-12 col-sm-12 pad-r-md res-m-bttm-lg">
${html}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/** Small mid-page call-to-action band. */
export function ctaSmallSection(c: TplChrome, text: string): string {
  return `    <div class="call-action cta-small has-parallax bg-primary">
        <div class="container">
            <div class="content row">
                <div class="cta-block">
                    <div class="cta-sameline">
                        <h2>${esc(text)}</h2>
                        <a class="btn btn-alt" href="${c.telHref}">Call ${esc(c.phone)}</a>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/** Testimonials slider (original section-quotes owl-carousel). */
export function testimonialsSection(reviews: Array<{ text: string; author: string }>): string {
  if (reviews.length === 0) return '';
  const items = reviews
    .map(
      (r) => `
            <div class="item center">
                <div class="quotes">
                    <div class="quotes-text"><p>${esc(r.text)}</p></div>
                    <div class="profile"><h5>${esc(r.author)}</h5></div>
                </div>
            </div>`,
    )
    .join('\n');
  return `    <!-- Testimonials -->
    <div class="section section-quotes section-pad has-bg dark-filter light bg-primary">
        <div class="container">
            <div class="content row">
                <h2 class="center">Testimonials</h2>
                <div class="testimonials style-v1">
                    <div id="testimonial" class="quotes-slider wide-sm">
    <div class="owl-carousel owl-theme">
${items}
    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/** FAQ section (accessible details/summary — no JS dependency). */
export function faqSection(faqs: Array<{ question: string; answer: string }>): string {
  if (faqs.length === 0) return '';
  const items = faqs
    .map(
      (f) => `
                <details class="faq-item" style="background:#fff;border:1px solid #e6ebf1;border-radius:6px;margin-bottom:10px;padding:14px 18px">
                    <summary style="font-weight:600;cursor:pointer;color:#373e45">${esc(f.question)}</summary>
                    <p style="margin-top:10px">${esc(f.answer)}</p>
                </details>`,
    )
    .join('\n');
  return `    <div class="section section-content section-pad">
        <div class="container">
            <div class="content row">
                <h2 class="text-center">Frequently Asked Questions</h2>
${items}
            </div>
        </div>
    </div>`;
}

/** Bottom call-to-action band (original call-action bg-primary). */
export function ctaBottomSection(c: TplChrome, opts: { heading: string; copy: string }): string {
  return `    <div class="call-action bg-primary">
        <div class="container">
            <div class="content row">
                <div class="cta-block">
                    <h2>${esc(opts.heading)}</h2>
                    <p>${esc(opts.copy)}</p>
                    <a class="btn btn-alt btn-lg" href="${c.telHref}">Call ${esc(c.phone)} Now</a>
                </div>
            </div>
        </div>
    </div>`;
}

/** Contact page body (info card + form + map — original section-contact). */
export function contactSection(c: TplChrome, opts: { appOrigin: string; hours: string }): string {
  const mapQuery = encodeURIComponent(`${c.city}, ${c.stateAbbr}`);
  return `    <!-- Contact Content -->
    <div class="section section-contents section-contact section-pad">
        <div class="container">
            <div class="content row">
                <div class="contact-content row">
                    <div class="drop-message col-md-8 pad-r res-m-bttm">
                        <h2>Contact Information</h2>
                        <div class="row">
                            <div class="col-sm-5 res-s-bttm-sm">
                                <p><strong>${esc(c.name)}</strong><br>${esc(c.addressLine)}</p>
                            </div>
                            <div class="col-sm-4 res-s-bttm-sm">
                                <p><strong>Contact Number</strong><br>Phone: <a href="${c.telHref}">${esc(c.phone)}</a><br>Email: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
                            </div>
                            <div class="col-sm-3">
                                <p><strong>Office Hours</strong><br>${esc(opts.hours)}</p>
                            </div>
                        </div>
                        <div class="gaps size-xs"></div>
                        <div class="contact-iframe-wrapper">${leadForm(c, opts.appOrigin)}</div>
                    </div>
                    <div class="contact-maps col-md-4">
                        <iframe title="Map of ${esc(c.city)}, ${esc(c.stateAbbr)}"
                                src="https://maps.google.com/maps?f=q&source=s_q&hl=en&q=${mapQuery}&ie=UTF8&z=12&t=m&output=embed"
                                style="width: 100%; height: 609px; border: 0"
                                frameborder="0"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/** Footer (original 4-column footer-widget + copyright bar). */
export function footerSection(c: TplChrome): string {
  const areaLinks = c.areas
    .map((a) => `<a href="${c.base}${a.href}" title="${esc(a.label)}">${esc(a.label)}</a>`)
    .join(', ');
  return `    <div class="footer-widget section-pad-md">
        <div class="container">
            <div class="row">
                <div class="widget-row row">
                    <div class="footer-col col-md-3 col-sm-6">
                        <div class="wgs wgs-footer">
                            <div class="wgs-content">
                                <div class="footer-logo">
                                    ${c.logoUrl ? `<img src="${c.logoUrl}" alt="${esc(c.name)}">` : `<h4 style="color:#fff">${esc(c.name)}</h4>`}
                                    <p>${esc(c.name)} — Serving ${areaLinks} in ${esc(c.city)}, ${esc(c.stateAbbr)}.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="footer-col col-md-3 col-sm-6 res-m-bttm">
                        <div class="wgs wgs-footer wgs-menu">
                            <h5 class="wgs-title">Our Services</h5>
                            <div class="wgs-content"><ul class="menu">${navList(c.services, c.base)}</ul></div>
                        </div>
                    </div>
                    <div class="footer-col col-md-3 col-sm-6 res-m-bttm">
                        <div class="wgs wgs-footer wgs-menu">
                            <h5 class="wgs-title">Quick Links</h5>
                            <div class="wgs-content">
                                <ul class="menu">
                                    <li><a href="${c.base}/">Home</a></li>
                                    <li><a href="${c.base}/services">Our Services</a></li>
                                    <li><a href="${c.base}/near-me">Areas We Serve</a></li>
                                    <li><a href="${c.base}/about-us">About Us</a></li>
                                    <li><a href="${c.base}/contact-us">Contact Us</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="footer-col col-md-3 col-sm-6 res-m-bttm">
                        <div class="wgs wgs-footer">
                            <h5 class="wgs-title">Contact Us</h5>
                            <div class="wgs-content">
                                <p>${esc(c.addressLine)}</p>
                                <p>Phone: <a href="${c.telHref}">${esc(c.phone)}</a><br>Email: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="copyright">
            <div class="container">
                <div class="row">
                    <div class="col-sm-12 text-center">
                        <p class="copyright-text">© ${c.year} ${esc(c.name)}. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
