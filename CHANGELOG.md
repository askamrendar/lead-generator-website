# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.5.1] — Production Hardening (Phase 5.5)

Consistency, reliability, and correctness pass over the existing surfaces — no
new features and no architectural changes. Two consistency audits drove the work;
every change keeps the build green (`typecheck` + `lint` + `test` + `build`).

### Fixed
- **Canonical origin was hardcoded to localhost (critical SEO bug).**
  `data/business.ts` set `siteUrl: 'http://localhost:3000'` and the
  `lib/site.ts` single-source-of-truth helpers were never imported, so every
  canonical URL, OG tag, sitemap entry, robots host, and JSON-LD `@id` emitted
  `localhost` in production. `siteUrl` now derives from `resolveSiteUrl()`
  (`NEXT_PUBLIC_SITE_URL`), and `assertProductionSiteUrl()` runs at build time
  (warns for the zero-env demo; `{ strict: true }` fails a real build).
- **Lead endpoint was unthrottled.** `/api/lead` — the most spam-exposed public
  route — now applies `enforceRateLimit(..., LIMITS.lead())` (previously dead
  code) and declares `runtime = 'nodejs'`, matching every sibling route.
- **Broken honeypot.** `leadSchema.company` was `.max(0)`, which made a bot
  submission fail validation with a `422` that revealed the trap and left the
  route's silent-drop branch unreachable. The field now parses so bots are
  silently dropped (`{ ok: true }`) as intended.
- **Cache readers disagreed.** The render pipeline enforced promptVersion +
  status + businessVersion + TTL while the content service checked promptVersion
  only, so a config change served stale content from one path and fresh from the
  other. Both now use a shared `isCacheEntryFresh()` (`lib/ai/cache/freshness.ts`).
- **API vs. rendered content drift.** `/api/ai/generate`/`regenerate` returned
  unrepaired content (possible duplicate benefits / `intro === heroCopy`) while
  pages repair on read. The content service now repairs before caching/returning.
- **Unauthenticated content-registry read.** `GET /api/ai/cache` returned the
  full cached content registry to anyone; it is now `requireAdmin`-gated like its
  DELETE/POST siblings.

### Changed
- **Consistent API error handling.** Added `serverError()` and wrapped the core
  logic of the AI generate/regenerate/batch/cache routes so an unexpected throw
  returns the same `{ error }` shape (logged server-side, no internals leaked)
  instead of a framework 500. The lead delivery seam now degrades to `502`.
- **Centralized site origin.** `lib/ai/providers/openrouter.ts` now uses
  `resolveSiteUrl()` instead of reading `NEXT_PUBLIC_SITE_URL` directly.
- **`/generate` is `noindex`.** Added `app/generate/layout.tsx` so the intake
  form (a client component with no metadata) is no longer an indexable SEO orphan.

### Added
- **`SECURITY.md`** (referenced by `lib/api/rate-limit.ts`): documents the API
  auth/rate-limit matrix, per-instance limiter caveat, honeypot, and canonical
  origin handling.
- **Environment docs.** `.env.example` now covers `ADMIN_API_TOKEN` (admin AI API
  fails closed without it), the eight `RATE_LIMIT_*` tunables, and
  `ALLOW_LOCALHOST_BUILD`.
- **Zero-dependency test suite** (`tests/`, `npm test`): Node's built-in test
  runner (`node --test`, type-stripped) covering lead validation + honeypot, the
  sliding-window rate limiter, site-URL resolution/guard, and cache freshness —
  17 tests, no new dependencies.

### Verified
- `npm run typecheck`, `npm run lint`, `npm test` (17/17), and `npm run build`
  all pass — **83 routes**, deterministic offline build unchanged.

## [0.5.0] — Website Builder (Template + Block Engine)

Turns the generator into a reusable, industry-agnostic **Website Builder**: pages
are composed from JSON block definitions, rendered under a swappable theme, and
driven by industry packs. Existing routes/SEO/AI are unchanged; the builder is an
additive system demonstrated at `/preview`.

### Added
- **Builder types (`lib/builder/types.ts`):** `BlockInstance`, `PageDefinition`,
  `BlockContext`, `ThemeTokens`, `IndustryPack`, `Template`.
- **Theme engine (`lib/builder/themes/`):** 8 themes (light, dark, modern, luxury,
  corporate, minimal, blue-collar, medical) as CSS-variable design tokens +
  `ThemeProvider` (re-skins any subtree, server-rendered, no flash).
- **Block engine (`components/blocks/` + `lib/builder/blocks/`):** 22 configurable,
  theme-/industry-aware blocks (hero, benefits, problems, stats, trust-badges,
  reviews, testimonials, timeline, team, pricing, before-after, gallery,
  service-grid, location-grid, related-services, related-locations, faq, lead-form,
  map, cta, emergency-banner, rich-text) + a block registry + `BlockRenderer`.
- **JSON-driven pages:** a `PageDefinition` (ordered block list) is composed from a
  template and rendered by the engine — no page layout is hardcoded.
- **Industry packs (`lib/builder/industries/`):** plumbing, hvac, roofing,
  electrical, generic — each with services, terminology, FAQs, schema type, image
  keywords, blog categories, prompt hints, and default theme/template.
- **Templates (`templates/`):** base, plumber, hvac, generic — per-page JSON layouts
  with base-template inheritance + a template registry.
- **Composer + selection (`lib/builder/compose.ts`, `select.ts`):** `composePage`
  resolves layouts; `selectBuild` (heuristic) and `aiSelectBuild` (provider-driven,
  fallback-safe) auto-pick template + theme + industry from the business.
- **Registries (`lib/builder/registry/`):** section, component, theme, industry,
  template, and generator registries + a `registrySummary()`.
- **`/preview` route:** renders the sample business as a themed, block-driven site
  with live template/theme/industry/page switching (noindex).

### Verified
- `tsc --noEmit`, `next lint`, `next build` all pass (83 routes; `/preview` added).
- Runtime: Plumbing auto-selects the plumber/blue-collar build; switching
  `?theme=`, `?template=`, `?industry=`, `?page=` re-themes and re-composes the page;
  blocks render for home and service page types; content resolves via the AI render
  pipeline (fallback offline).

## [0.4.0] — AI Rendering Engine

Connects the AI Content Engine to the live website. Pages now render **cache-first
AI content with deterministic fallback**, populated by a pre-generation pipeline.
Routing, SEO, and schema are unchanged.

### Added
- **Render pipeline (`lib/ai/render.ts`):** `resolvePageContent(ctx)` — read-only,
  cache-first, deterministic fallback. Never calls a provider and never writes at
  render, so rendering can't block or incur cost. Validates + auto-repairs cached
  content before use.
- **Validation + repair (`lib/ai/validation.ts`):** guarantees no missing heading,
  CTA, FAQ, or metadata, caps meta length, and de-duplicates paragraphs.
- **Cache metadata:** entries now carry `status`, `businessVersion`, `ttlSeconds`,
  and content `hash` (backward compatible). Stale entries (prompt-version bump,
  config change, or TTL) fall back automatically.
- **Versioning (`lib/ai/versioning.ts`):** draft/published/regenerated/archived
  statuses, bounded history, and one-step **rollback**.
- **Generation utilities (`lib/ai/generation.ts`):** enumerate contexts and batch-
  generate by scope (website/core/services/cities/states/counties/zips/
  neighborhoods/matrix) with bounded concurrency.
- **Pre-generation:** `scripts/pregenerate.mjs` + `npm run ai:pregenerate` populate
  `.ai-cache/` before a build so AI content is baked into the static pages.
- **Expanded API:** `/api/ai/regenerate`, `/api/ai/status`, `/api/ai/cache`
  (list/history/delete/rollback), `/api/ai/batch`, `/api/ai/provider`,
  `/api/ai/prompts` (alongside the existing `/api/ai/generate`).
- **Pages wired cache-first:** home, about, service, service×city, city, state,
  county, ZIP, neighborhood now source hero/intro/benefits/FAQ/CTA/metadata from
  the render pipeline (deterministic output preserved when the cache is empty).

### Verified
- `tsc --noEmit`, `next lint`, `next build` all pass. Offline build (empty cache)
  renders deterministic content across 82 routes.
- End-to-end: seeding an AI cache entry then rebuilding causes the static page to
  render the AI hero + intro; an uncached page stays deterministic; `/api/ai/status`
  reports cache coverage.

## [0.3.0] — AI Content Engine

Adds a modular, provider-agnostic AI content layer under `lib/ai/`. The Generator
Core, routing, SEO, and all existing pages are unchanged — the deterministic
engine becomes the offline fallback provider.

### Added
- **Provider abstraction (`lib/ai/providers/`):** OpenAI, Anthropic, Gemini, and
  OpenRouter providers (dependency-free, via `fetch`) plus a `mock` provider.
  The active provider is chosen by `AI_PROVIDER`; with no key it falls back to
  deterministic content. OpenAI/OpenRouter also support SSE streaming.
- **Config (`lib/ai/config.ts`):** env-driven provider/model/temperature/limits.
- **Prompt library (`lib/ai/prompts/`):** versioned page, field, and blog prompt
  templates (`PROMPT_LIBRARY_VERSION`). Prompts never live in business logic.
- **Cache (`lib/ai/cache/`):** file-backed store (`.ai-cache/`) with in-memory
  read-through, timestamps, and stable keys that invalidate on prompt-version bump.
- **Content service (`lib/ai/services/content-service.ts`):** cache → provider →
  validate + merge AI draft over deterministic baseline → cache. Retry with
  backoff, concurrency/rate limiting, and full error recovery.
- **Deterministic fallback (`lib/ai/services/deterministic.ts`):** bridges the
  Phase 1/2 content + link engines into the unified content shape.
- **18 agents (`lib/ai/agents/`):** page agents (home/about/service/city/state/
  county/neighborhood/ZIP/serviceCity), field agents (meta title/description,
  hero, FAQ, CTA, review, internal-link), and utility agents (image-prompt,
  schema-enrichment, blog-topic).
- **Image-prompt engine (`lib/ai/services/image-prompts.ts`):** text-to-image
  prompts + alt text for hero/OG/service/location/gallery/before-after/icon/bg,
  stored separately from page copy.
- **Blog Engine foundation (`lib/ai/services/blog.ts`):** topic, outline, keyword
  map, article-prompt, related-article, category, and tag generators (no pages yet).
- **API (`app/api/ai/generate/route.ts`):** generate or regenerate a single page's
  content; `GET` reports the active engine.
- Env (`.env.example`), `.gitignore` (`.ai-cache/`), and a `type-check` script.

### Verified
- `tsc --noEmit`, `next lint`, `next build` all pass; sitemap unchanged (66 URLs).
- Runtime: full structured content for every page type; cache hit on repeat;
  `regenerate:true` bypasses cache; invalid params 404; live OpenAI path attempts
  the call and recovers to the deterministic fallback on error.

## [0.2.0] — Nationwide SEO Generator

Expands the Generator Core into a nationwide location engine. The Core is unchanged.

### Added
- **Geo taxonomy (Phase 6):** county, ZIP, and neighborhood selectors plus
  nearby-cities / nearby-ZIPs / nearby-counties in `lib/generator/config.ts`.
- **Location routes:** state hub (`/locations/[state]`), county hub
  (`/locations/[state]/county/[county]`), ZIP (`/locations/zip/[zip]`), and
  neighborhood (`/locations/[state]/[city]/[neighborhood]`) pages.
- **Service × City matrix (Phase 5):** `/services/[slug]/[state]/[city]` landing pages
  with unique copy, FAQs, stats, common-problems, emergency CTA, and per-page geo/schema.
  Rendered with ISR (`revalidate = 86400`) so the matrix can scale to thousands of combos.
- **Internal link engine (`lib/generator/links.ts`):** deterministic link clusters for
  every page type, rendered by the reusable `RelatedLinks` component. Existing city and
  service pages were extended (additively) to use it.
- **SEO engine expansion:** `serviceInCitySchema`, `placeSchema`
  (AdministrativeArea / PostalCodeArea / Place), `speakableSchema`, `imageObjectSchema`,
  `articleSchema`; geo meta tags (`geo.position/placename/region`, `ICBM`) and
  `hreflang` (`en-US`) in the metadata builder.
- **Content engine expansion:** intros + meta descriptions for service×city, county, ZIP,
  neighborhood, and state pages; `locationStats`, `commonProblems`, `emergencyCtaCopy`,
  `serviceCityFaqs` — all deterministically unique per page.
- **New components:** `RelatedLinks`, `StatBar`, `CommonProblems`, `EmergencyCTA`.

### Verified
- `tsc --noEmit`, `next lint`, `next build` all pass. Sitemap grew **24 → 66 URLs**.
  Runtime-checked: geo meta + Speakable/Service/FAQ JSON-LD render; ~20 internal links
  per matrix page.

## [0.1.0] — Generator Core

### Added
- **Project setup (Phase 0):** Next.js 15 + React 19 + TypeScript + Tailwind 3 +
  ESLint + Prettier. Full documentation set (README, ROADMAP, MANIFEST, CHANGELOG, LICENSE).
- **Business intake (Phase 2):** `BusinessConfig` Zod schema, `/generate` intake form,
  `/api/generate` validation endpoint, config selectors and path/slug helpers.
- **Website generator (Phase 3):** Config-driven homepage, about, and contact pages;
  dynamic `/services/[slug]` and `/locations/[state]/[city]` routes with
  `generateStaticParams`; mega-nav header, footer, and breadcrumbs.
- **SEO engine (Phase 4):** Per-page metadata (title/description/canonical/OG/Twitter)
  and JSON-LD builders (LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite,
  Organization); `sitemap.ts`, `robots.ts`, `manifest.ts`.
- **Content engine (Phase 7, partial):** Deterministic per-page unique copy with
  LLM-swappable function seams.
- **Lead generation (Phase 10, partial):** Sticky call button, click-to-call, lead form.
- **Sample data:** Apex Plumbing Co. business config demonstrating the full pipeline.

### Verified
- `tsc --noEmit`, `next lint`, and `next build` all pass. Production build
  prerenders 24 routes (Next.js 15.5.20, Node 22).

### Notes
- Content is deterministically generated (no external API needed to run the core).
