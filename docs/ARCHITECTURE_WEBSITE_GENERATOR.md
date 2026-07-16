# True AI Website Generator — Architecture Map & Build Plan

> Written 2026-07-16, BEFORE implementation, per mission requirements.
> Principle: the generation engine already renders ONE business (the sample) beautifully.
> The mission is to feed that same engine EVERY tenant's business. Extend, never duplicate.

## 1 · What exists (reused, untouched)

```
BusinessConfig (Zod, lib/generator/schema)      ← the universal input
  ├─ geo/config selectors (lib/generator/config): services, cities, counties, zips,
  │    neighborhoods, service×city matrix, absoluteUrl
  ├─ internal-link engine (lib/generator/links)
  ├─ SEO engine (lib/seo/metadata buildMetadata · lib/seo/schema JSON-LD)
  ├─ AI content pipeline (lib/ai): PageContext builders (context.ts) →
  │    resolvePageContent (cache-first, keyed by businessConfigHash → ALREADY per-business)
  │    → deterministic fallback (offline-safe)
  └─ Builder engine: composePage(template,pageType) → PageDefinition(blocks)
       → buildBlockContext → BlockRenderer + ThemeProvider (ALL server components —
       only LeadForm inside lead-form block is a client component)

Website aggregate: businessConfig (wizard) → wizardToBusinessConfig (adapter)
  → parseBusinessConfig → BusinessConfig   [wired in generate-service since RC]
BuilderDocument (Website.builderConfig): wraps ONE PageDefinition (home) + theme +
  globalStyles + status(DRAFT/PUBLISHED) + revisions.
Jobs queue + worker; deployment service (async); domains (DNS verify); media (local-fs).
```

## 2 · The gap (why sites aren't real yet)

Pages other than home are never enumerated/rendered for a tenant website; the dashboard
preview feeds the SAMPLE business into the engine; deploy exports JSON; no route serves a
tenant site; no host→website mapping.

## 3 · The key insight (drives every milestone)

Pages are **deterministic functions of (template, businessConfig)** — only the home page is
user-edited (BuilderDocument). The marketing site already composes service/city pages at
request time. Therefore multi-page generation needs **NO new storage and NO migration**:
enumerate routes from the website's own BusinessConfig and compose each page on demand —
exactly like the marketing site does for the sample. One new thin service provides this for
any Website; preview, hosting, and export all consume it.

## 4 · New modules (thin, single-responsibility)

| Module | Responsibility |
| --- | --- |
| `lib/websites/render-service.ts` | THE bridge: `websiteBusiness()` (config→BusinessConfig, null-safe), `websiteRoutes()` (enumerate all pages from geo selectors), `renderContextForPath()` (path → PageContext + PageDefinition, honoring the user-edited home + published state), per-site metadata with origin override |
| `app/sites/[websiteId]/[[...slug]]/page.tsx` | M3+M5 surface: renders ANY page of ANY website through the standard pipeline. Published → public; draft → owner-only (fail-closed 404) |
| `components/site-render/SiteShell.tsx` | Tenant-site chrome (nav from routes, footer from business) shared by hosted route AND export — one implementation |
| `lib/export/zip.ts` | Dependency-free ZIP writer (STORE + CRC32), pure, unit-tested |
| `lib/export/static-site.ts` | React SSR (`renderToStaticMarkup`) of every route + theme CSS + robots/sitemap/manifest → ZIP bytes; interactive blocks get static-safe substitutes (plain `<form>` posting to the app's `/api/lead`) |
| middleware extension | Foreign Host header → rewrite to the sites route (custom-domain hosting); Edge-safe (no DB in middleware — resolution happens in the route) |

## 5 · Extensions to existing modules (additive)

- PageType union: + `contact`, `faq` (base template layouts, deterministic content cases,
  prompt-library TASK entries — compiler enforces completeness).
- Privacy/Terms: deterministic legal PageDefinitions built from business data using the
  existing `rich-text` block (no new page types needed).
- `website.generate` handler: after composing, if an AI key is configured, warm the
  per-website content cache via the EXISTING engine batch (`generateWebsite(business)`);
  offline mode = skip silently (never fail) + honest UI banner.
- Deployment zip provider: artifact = the real static ZIP (from lib/export), not JSON.
- AI Generator tab: offline-mode banner + per-website image-prompt list (hero/services/
  locations/logo) from the existing image-prompt engine; deterministic SVG favicon.

## 6 · Order & verification

M1 preview-from-own-config → M2 route enumeration + new page types → M3 hosted/preview
route → M4 static ZIP export → M5 domain middleware → M6 AI wiring + banner → M7 image
prompts + favicon. Six gates after each; live Railway re-test of "Empire Plumbing NYC" at
the end (the UAT site must show Empire/New York everywhere).

## 7 · Scalability notes

Route render is per-request compose (same cost as the marketing site, which ISR-caches
thousands of pages) — hosted tenant pages get `revalidate` caching. Content cache is
per-business-hash (already multi-tenant-safe). Export runs on the deployment queue (async,
reaper-protected). No N+1: route enumeration is pure in-memory from one JSON read.
