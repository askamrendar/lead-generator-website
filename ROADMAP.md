# Roadmap — Lead Generator Website

A phased plan for the full SaaS. Each phase must keep the project **buildable**.
`[x]` = done, `[~]` = partially done, `[ ]` = not started.

---

## Phase 0 — Project Setup  `[x]`
- [x] Folder structure
- [x] Dependencies (`package.json`)
- [x] TypeScript / Tailwind / ESLint / Prettier config
- [x] Documentation (README, ROADMAP, PROJECT_MANIFEST, CHANGELOG, LICENSE)
- [ ] Git init + first commit *(user-run: `git init && git add -A && git commit`)*

## Phase 1 — Auth, Orgs, Dashboard, Database  `[ ]`
- [ ] NextAuth setup
- [ ] Organizations / teams model
- [ ] Prisma + PostgreSQL (Supabase) schema
- [ ] Authenticated dashboard shell

## Phase 2 — Business Intake + Generator Core  `[x]`
- [x] `BusinessConfig` Zod schema (single source of truth)
- [x] Intake form at `/generate` (React Hook Form + Zod)
- [x] `/api/generate` validation endpoint
- [x] Config selectors + slug/path helpers

## Phase 3 — Website Generator (routing, page builder, nav)  `[x]`
- [x] Home / About / Contact pages from config
- [x] Dynamic service routing `/services/[slug]`
- [x] Dynamic location routing `/locations/[state]/[city]`
- [x] `generateStaticParams` for all dynamic routes
- [x] Header (mega-nav) + Footer + breadcrumbs
- [x] State hub, county hub, ZIP, and neighborhood sub-routes
- [x] Internal link engine connecting every page (`lib/generator/links.ts`)

## Phase 4 — SEO Engine  `[x]`
- [x] Per-page metadata (title, description, canonical, OG, Twitter)
- [x] JSON-LD: LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite, Organization
- [x] JSON-LD: Speakable, ImageObject, Article, Place/AdministrativeArea/PostalCodeArea
- [x] Geo meta tags (geo.position/placename/region, ICBM) + hreflang (en-US)
- [x] `sitemap.ts`, `robots.ts`, `manifest.ts`
- [ ] RSS feed, HTML sitemap page, Video schema *(next expansion)*

## Phase 5 — Service Generator  `[x]`
- [x] Full service page template (hero, benefits, process, why-us, FAQ, related)
- [x] Bulk service × city landing matrix (`/services/[slug]/[state]/[city]`) with ISR
- [x] Unlimited services supported via config (engine is unbounded)

## Phase 6 — Location Generator  `[x]`
- [x] City page template with localized copy
- [x] State hub, county hub, ZIP, and neighborhood pages
- [x] Nearby cities / ZIPs / counties selectors
- [ ] Driving-direction pages *(next expansion)*

## Phase 7 — Content Engine (AI)  `[x]`
- [x] Deterministic unique-copy engine with LLM-swappable seams
- [x] Provider abstraction: OpenAI, Anthropic, Gemini, OpenRouter (+ mock), env-selected
- [x] Versioned prompt library (page + field + blog prompts)
- [x] 18 reusable content agents + image-prompt engine
- [x] File-backed content cache with timestamps + per-page regeneration
- [x] Deterministic fallback (offline-safe) + retry/rate-limit/error recovery
- [x] `/api/ai/generate` (generate + regenerate a single page)
- [x] Blog Engine **foundation** (topic/outline/keyword/article-prompt/related/category/tag generators)
- [x] **Cache-first rendering pipeline** wired into all content pages (`lib/ai/render.ts`)
- [x] Pre-generation (`/api/ai/batch`, `npm run ai:pregenerate`), content versioning + rollback
- [x] Validation + auto-repair, TTL/business-version cache invalidation
- [x] Expanded API: generate/regenerate/status/cache/batch/provider/prompts

## Website Builder — Template + Block Engine  `[x]`
- [x] Builder types + block/theme/industry/template/generator/component registries
- [x] Theme engine: 8 themes (light/dark/modern/luxury/corporate/minimal/blue-collar/medical) as CSS-variable tokens + `ThemeProvider`
- [x] Block engine: 22 configurable, theme-aware blocks + `BlockRenderer`
- [x] JSON-driven pages: `PageDefinition` (block list) → render engine → Next.js page
- [x] Industry packs (plumbing/hvac/roofing/electrical/generic) with services, terminology, FAQs, schema type, prompts
- [x] Templates (base/plumber/hvac/generic) with per-page JSON layouts + inheritance
- [x] Page composer + heuristic **and** AI-driven template/theme/industry selection
- [x] `/preview` route renders any business as a themed, block-driven site (switch template/theme/industry/page live)
- [ ] Remaining verticals (roofing/mold/cleaning/etc. templates), visual drag-order editor *(one file each / future UI)*

## Phase 5.5 — Production Hardening  `[x]`
- [x] Single-source site origin + build guard; `/api/lead` rate limit + honeypot fix
- [x] Unified cache freshness; consistent API error handling; admin-gated cache read
- [x] `SECURITY.md`, env docs, first test suite (`npm test`). See CHANGELOG `[0.5.1]`.

## Phase 6 — Restructuring & Engineering Standards  `[x]`
- [x] Promote `themes/` + `industries/` to repo root; `LeadForm`→`components/forms`, `JsonLd`→`components/seo`
- [x] Add `ARCHITECTURE.md`, `docs/`, `.github/` (CI + templates), `.ai/` (working memory)
- [x] Document (not scaffold) all future modules; routes/SEO verified byte-identical

> **Future modules are documented, not scaffolded.** Each folder below is created
> only when real production code lands (see `ARCHITECTURE.md` §2).

## Phase 8 — Blog Engine  `[~]`  →  `app/blog/`, `lib/blog/`
- [x] Generators foundation (topics, outlines, keyword maps, article prompts, categories, tags)
- [ ] Blog pages, routing, RSS, topic-cluster wiring *(deferred intentionally)*
## Phase 9 — Image / Media Engine  `[ ]`  →  `lib/media/`, `public/`
- [ ] Real image generation from existing prompts, storage/CDN, optimization
## Phase 10 — Lead Generation / CRM  `[~]`  →  `lib/crm/`
- [x] Sticky call button, lead form, click-to-call, server-side capture + anti-spam
- [ ] Persistence + CRM/email/SMS delivery (the `app/api/lead` seam), multi-step form
## Phase 1 — Authentication & Organizations  `[ ]`  →  `lib/auth/`, `app/(auth)/`  *(foundational)*
- [ ] Accounts, sessions, orgs/teams, RBAC, database (Prisma + Postgres)
## Phase 11 — Admin console  `[ ]`  →  `app/admin/`, `lib/admin/`
## Phase 12 — Customer Dashboard  `[ ]`  →  `app/dashboard/`, `components/dashboard/`
## Phase 13 — Billing / Subscriptions / Credits  `[ ]`  →  `lib/billing/`
## Phase 14 — Deployment / Custom Domains / CI  `[ ]`  →  `lib/deployment/`
## Phase 15 — Analytics, Logging, Performance, A11y, Security, Testing  `[~]`
- [x] Security headers, render pipeline never blocks, rate limiting + retry, test suite + CI
- [ ] Analytics (`lib/analytics/`), structured Logging (`lib/logging/`), Lighthouse CI, full audit

---

### Current milestone
**Phase 6 — Restructuring** complete and build-verified. Implemented code sits in
a clean enterprise layout; future modules are documented, not scaffolded.

### Next milestone
Recommended order (value ÷ dependency): **Logging → Blog pages → CRM delivery →
Media → Auth →** Dashboard → Admin → Billing → Deployment → Analytics.
See `ARCHITECTURE.md` §4 and `PROJECT_MANIFEST.md`.
