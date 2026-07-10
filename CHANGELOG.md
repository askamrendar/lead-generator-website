# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — Dashboard Redesign (product-quality pass)

A reuse-first upgrade of the dashboard toward a Vercel/Linear-class product feel, on
the **existing design system**. No new deps, no auth/authorization/model changes.
Marketing/SEO byte-preserved (home static, **sitemap 66**, home **JSON-LD = 4 blocks**).

### Added
- **Action-oriented home** (`app/dashboard/page.tsx` + `components/dashboard/home/*`):
  welcome, real workspace counts, quick actions, "Continue working" (real recent
  websites), and **honest** placeholder panels (deployments/AI/domains/activity/build
  queue/system health/AI credits/updates) — never fabricated data.
- **Command palette (⌘K / Ctrl+K)** (`lib/search/` + `components/dashboard/CommandPalette.tsx`
  + `app/dashboard/search-actions.ts`): keyboard-navigable, searches static commands +
  **tenant-scoped** websites (via the service), extensible by group. Header search is now
  a ⌘K trigger.
- **Settings reorganized** (`app/dashboard/settings/*` + `SettingsNav`): 11 sections —
  Profile, Organization, Workspace (real from context), Preferences (theme), Security,
  AI/Deployment Providers (structured), API Keys, Domains, Notifications, Danger Zone. No billing.
- **Website Manager actions** completed (`WebsiteActions`): full set (Open/Builder/Generate/
  SEO/Pages/Deploy/Domains/Analytics/Media/Versions/Rename/Duplicate/Archive/Download ZIP/Delete),
  mapped to detail tabs.
- **Create Website wizard** gains an entry step: **Manual / Import URL / Google Business
  Profile** (seed fields carry forward; AI auto-determination deferred to 7.2.4, marked).
- **Deployment & Domain UI shells** on the website tabs (status/history/env-vars/logs/
  rollback/provider; DNS/SSL) — **UI only, no logic**, ready for Phase 8/8.5.
- Reusable `components/ui/panel.tsx`, `components/dashboard/{InfoList,SettingsNav,SettingsPlaceholder}`.

### Changed
- `DashboardHeader` search → command-palette trigger; `DashboardShell` registers the
  global ⌘K shortcut and mounts the palette.

### Tests
- `tests/search.test.mjs` (registry: static commands, filter, group order). **Suite 76/76.**

### Verification
- `lint` · `type-check` · `test` (76/76) · `build` — all green; SEO/sitemap/JSON-LD unchanged.

## [Unreleased] — Phase 7.2.3 · Website Manager

The Website Manager — create, organize, and manage websites (it does **not** edit
content; the Visual Builder remains separate). Website is the central aggregate;
future modules attach to it. Additive; marketing routes/SEO byte-preserved (home
static, sitemap 66). No generation/builder/deployment.

### Database
- `Website` extended (migration `0002_website_manager`, additive): `language`,
  `timezone`, `businessConfig` (wizard config — the single home for business info),
  `archivedAt`, + `[projectId, status]` index. `prisma generate` run; migration is
  developer-applied.

### Added — data layer (`lib/websites/`)
- `service.ts` — the only read/write path for websites; **every op flows through the
  tenant-access layer** (`require*Access` + RBAC) and returns DTOs. Lazily provisions a
  default Project per workspace; unique slug per project. `list/get/create/rename/
  duplicate/archive/restore/delete`.
- `schema.ts` (Zod wizard steps — PURE, tested), `status.ts` (derived badges — PURE,
  tested), `types.ts`, `nav.ts` (per-website tab config).

### Added — UI (`app/dashboard/websites/`, `components/websites/`)
- **List** — filterable/searchable table (`WebsiteList`), status badges, per-row
  `WebsiteActions` (rename modal, duplicate, archive/restore, delete confirm; export/
  connect-domain/preview marked soon).
- **Creation wizard** (`WebsiteWizard`) — 6 steps (Business, Location, Brand, Details,
  SEO, Review), per-step Zod validation; **stores configuration only** (no generation).
- **Website detail shell** — `[websiteId]/layout.tsx` (loads via tenant-access → 404 on
  no-access) + config-driven tab nav (Overview, Builder, AI Generator, Pages, SEO,
  Deployments, Domains, Media, Analytics, Versions, Settings). Overview (real) + Settings
  (rename + archive/restore + delete) are live; the rest are placeholders.
- Server actions (`actions.ts`) wrap the service with revalidation + redirects.

### Tests
- `tests/website-schema.test.mjs` + `website-status.test.mjs` (+10). **Suite 73/73 pass.**

### Verification
- `lint` · `type-check` · `test` (73/73) · `build` — all green; sitemap 66, home static.

## [Unreleased] — Phase 7.2.2 · Dashboard Foundation

The permanent authenticated app shell every future module mounts into. Additive;
marketing routes/SEO byte-preserved (home static, sitemap 66). No Website/CRUD/Builder
features (placeholder pages only).

### Added — shell (`components/dashboard/`, `app/dashboard/`)
- `DashboardLayout` (server: loads tenant context, redirects if unauthenticated) →
  `DashboardShell` (responsive: fixed desktop sidebar + mobile drawer + sticky header,
  content wrapped in an `ErrorBoundary`). `SidebarNav` (config-driven, active state,
  "Soon" chips), `DashboardHeader`, `Breadcrumbs`, `OrganizationSwitcher`,
  `WorkspaceSwitcher`, `UserMenu`, `NotificationsButton` (placeholder), `PageContainer`,
  `PlaceholderPage`.
- Pages: `app/dashboard/` home (stat cards + recent-activity placeholder) + 10 routes
  (websites, templates, ai-generator, deployments, domains, media, team, api-keys,
  settings, help). Route group protected by middleware; layout is `force-dynamic`, noindex.

### Added — generic UI primitives (`components/ui/`)
- `dropdown`, `modal` (Modal + Drawer), `confirm-dialog`, `skeleton`, `loading-overlay`,
  `error-boundary`, `page-header`, `empty-state`, `stat-card`, `data-table` (generic),
  `action-menu`, `search-input`, `filter-bar`, `pagination` — dependency-free, accessible,
  reusable by every future module.

### Added — data/config (`lib/dashboard/`)
- `nav.ts` (config-driven navigation — the single source; new modules register here),
  `context.ts` (`loadDashboardContext`: session + memberships + workspaces, cookie-based
  current selection, membership-scoped), `actions.ts` (org/workspace switch server actions
  that **validate membership via the tenant-access layer** before persisting).

### Changed
- `middleware.ts` matcher now also covers the `/dashboard` and `/app` base paths.

### Verification
- `lint` · `type-check` · `test` (63/63) · `build` — all green; **sitemap 66 preserved**,
  marketing home still static, 11 dashboard routes dynamic behind auth. UI is
  compile-verified; component/DOM tests remain backlog `T-002`.

## [Unreleased] — Phase 7.2.1 · Authentication Experience

The complete auth UI over the existing 7.1 APIs. Additive; marketing routes and SEO
are byte-preserved (sitemap 66 URLs; home/about/contact/generate/locations unchanged).

### Added — pages (`app/(auth)/`, noindex, chrome-free)
- `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `logout`,
  and `invitations/[token]` (accept), plus a centered `AuthLayout` (brand mark, theme
  toggle, toast provider).

### Added — components (`components/auth/`)
- `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`,
  `AcceptInvitationForm`, `VerifyEmailClient`, `LogoutClient`; shared `FormField`,
  `LoadingButton`, `PasswordField` (show/hide), `PasswordStrengthMeter`, `OAuthButtons`,
  `RememberMe`, `AuthCard`, `AuthDivider`.
- Infra: `components/ui/toast.tsx` (dependency-free toast provider), `components/theme/theme.tsx`
  (dark-mode toggle + no-FOUC script), `components/layout/SiteChrome.tsx` (hides marketing
  chrome on app routes — marketing output unchanged).
- `lib/auth/password-strength.ts` (pure, tested) · `lib/auth/providers/enabled.ts`
  (server-side enabled-OAuth list, offline-safe).

### Added — API
- `POST /api/auth/accept-invitation` — consumes a hashed invite token → org (+team)
  membership, idempotent; requires the session email to match. (Invite *creation* is Phase 9.)

### Changed
- `app/layout.tsx` — routes marketing chrome through `SiteChrome`; adds the theme
  no-FOUC script. Marketing SSR output (JSON-LD, sitemap, routes) unchanged.

### UX
- Google/GitHub sign-in (auto-shown only when configured), Remember-me (email prefill),
  dark mode, loading states, toasts, mobile-responsive, accessible forms
  (`aria-invalid`/`aria-describedby`/`role="alert"`, labeled controls, live regions).
  Wired open-redirect-safe callback handling. Future-ready for MFA/passkeys/magic-links/SSO.

### Tests
- `tests/auth-password-strength.test.mjs` (pure scorer). **Suite 63/63 pass.** UI is
  compile-verified (type-check + build); component/DOM tests remain backlog `T-002`.

### Verification
- `lint` · `type-check` · `test` (63/63) · `build` — all green; sitemap 66 preserved.

## [Unreleased] — Phase 7.2.0 · Authorization & Tenant Access Foundation

The centralized authorization layer — the **single supported way** to access any
tenant resource. Additive; no engine, route, or SEO change (sitemap 66 URLs preserved).

### Added — `lib/auth/access/`
- **Pure decision core** (`engine.ts`, `errors.ts`, `context.ts`) — fully unit-tested,
  no Prisma/Auth.js/next: `buildAccessContext` (authenticate → confirm membership
  → authorize → scope), `authorize`/`resolveEffectiveRole`/`assertAuthenticated`/
  `assertFound`, `permissionsForRole`, and `*Scope` helpers that derive tenant `where`
  fragments from a context.
- **Node resolver** (`resolver.ts`) — `requireOrganizationAccess` / `requireWorkspaceAccess`
  / `requireProjectAccess` / `requireWebsiteAccess`, built from a `defineResourceAccess`
  registry factory (add a future resource with one loader + code — engine untouched).
- **Error taxonomy** (`errors.ts`) — `AccessError` with codes `UNAUTHENTICATED` /
  `FORBIDDEN` / `NOT_FOUND` / `INVALID_TENANT|WORKSPACE|PROJECT|WEBSITE`; tenant-hiding
  (cross-tenant → `NOT_FOUND`), fail-closed status map, generic client messages.
- **HTTP mapping** (`http.ts`) — `accessErrorResponse(err)` → consistent 401/403/404
  (falls through to `serverError` for non-access errors).
- Public barrel `index.ts` is the import surface (`@/lib/auth/access`).

### Changed
- `lib/auth/permissions/rbac.ts`: added `PERMISSIONS` + `permissionsFor(role)`.
- `lib/auth/session.ts`: removed the ad-hoc `requireOrgPermission` (superseded by the
  access layer) — session.ts is now membership **primitives** only. No duplication.

### Tests
- `tests/auth-access-engine.test.mjs` + `auth-access-errors.test.mjs` — isolation at
  every depth (→ `NOT_FOUND`), unauthenticated/forbidden/missing, permission
  inheritance, scoped-query generation, status mapping. **Suite 57/57 pass.**

### Verification
- `lint` · `type-check` · `test` (57/57) · `build` — all green; sitemap 66 preserved.

## [Unreleased] — 0.7.0-alpha · SaaS Foundation (Phase 7.1)

Adds the multi-tenant **authentication + database** foundation. Fully **additive** —
no generation engine (AI, Website Builder, themes, industries, templates, SEO) was
changed; routes/SEO/sitemap (66 URLs) are byte-preserved. Auth is isolated in
`lib/auth/` + `lib/db/`; the generation engines contain zero auth logic.

> **Resequence:** Auth/DB (previously "Phase 10" / `T-020`) was pulled forward as
> **Phase 7.1** by explicit instruction; the Visual Builder becomes Phase 7.2.
> See ADR-0007 (`.claude/decisions.md`).

### Added — Authentication (Auth.js v5)
- `next-auth@5.0.0-beta.31` with **JWT** sessions and an Edge/Node config split:
  Edge-safe `lib/auth/config.ts` (→ `middleware.ts`), full Node `lib/auth/auth.ts`
  (adapter + Credentials).
- **Credentials** provider with **scrypt** password hashing (`lib/auth/password.ts`,
  `node:crypto` — no native dep) + conditional **Google/GitHub** OAuth that self-disable
  when their env secrets are absent (offline-safe).
- Flows: `POST /api/auth/register`, Auth.js `[...nextauth]` (login/logout/OAuth/session),
  **email verification** + **password reset** architecture (`verify-email`,
  `forgot-password`, `reset-password`) with single-use hashed tokens
  (`lib/auth/tokens.ts`) and a dev-log email seam (`lib/auth/email.ts`).
- **RBAC** (`lib/auth/permissions/roles.ts` + `rbac.ts`), server session/tenant helpers
  (`lib/auth/session.ts`), new-user auto-provisioning (`lib/auth/provisioning.ts`),
  Zod schemas (`lib/auth/validation.ts`), and `middleware.ts` guarding reserved
  `/dashboard` + `/app` routes. New public `auth` rate-limit bucket reuses the existing
  `lib/api/security.ts` seam.

### Added — Database (Prisma 6 + PostgreSQL)
- `prisma/schema.prisma` — **14 models**: `User`, `Account`, `Session`,
  `VerificationToken`, `PasswordResetToken`, `Organization`, `Workspace`,
  `WorkspaceSettings`, `Membership`, `Team`, `TeamMembership`, `TeamInvitation`,
  `Project`, `Website` (+ `Role`/`InvitationStatus`/`WebsiteStatus` enums). Ownership:
  **Organization → Workspace → Project → Website**; `Website` is the canonical owner of
  builder/theme/template/industry/AI/SEO artifacts (referenced by id/value).
- `prisma/migrations/0001_init/migration.sql` (generated offline), `lib/db/prisma.ts`
  hot-reload-safe client singleton, `docker-compose.yml` (Postgres 16 dev), and Neon
  production guidance + auth env in `.env.example`. `package.json` gains `db:*` scripts
  and a `postinstall: prisma generate` hook.

### Changed
- `tsconfig.json`: enabled `allowImportingTsExtensions` (valid under `noEmit`) so
  `permissions/rbac.ts` can value-import `roles.ts` with an explicit `.ts` extension —
  required by the Node type-stripping test runner (single-source hierarchy kept).

### Tests
- +4 zero-dependency `node --test` suites (`auth-password`, `auth-tokens`, `auth-rbac`,
  `auth-validation`). Suite total **40/40 pass**.

### Security hardening (post-review)
- **H1 — Auth.js `trustHost`:** now configured via `AUTH_TRUST_HOST` (secure default —
  trusted in dev/Vercel, explicit opt-in behind other proxies). Prevents `UntrustedHost`
  sign-in failures in production. Documented in `.env.example`.
- **M1 — enumeration-safe registration:** `POST /api/auth/register` returns an identical
  generic success whether or not the email exists (collisions logged server-side only);
  password is always hashed first so timing does not leak existence.

### Verification
- `npm run lint` · `type-check` · `test` (40/40) · `build` (exit 0) — all green offline.
  Live DB migration (`docker compose up` → `npm run db:migrate`), OAuth secrets, and an
  email provider are developer-run follow-ups.

### Architecture review — ✅ Production Approved (2026-07-10)
- Senior architecture + security + scalability review completed. Scores: Architecture 9 ·
  **Production Readiness 9** · Security 9 · Scalability 6 · Maintainability 9 · Extensibility 9.
  No Critical issues. Cleared for Phase 7.2. Tracked follow-ups: `T-035` tenant-access
  guard (7.2 foundation), `T-036` apply/verify live migration, `T-032` shared rate-limit
  store, `T-037`–`T-039`. See `.claude/decisions.md` ADR-0007.

### Not included (future milestones)
- Dashboard/login UI, billing, deployment providers, CRM, blog, admin, analytics,
  media — and `Deployment`/`Domain` tables (deferred to the deployment milestone).

## [0.6.0] — Restructuring & Engineering Standards (Phase 6)

Reorganizes the **implemented** code into a clean, enterprise-grade layout and
**documents** (does not scaffold) the future modules. Behavior-preserving: no
routes, SEO, AI rendering, or tests changed — only file locations, import
aliases, and documentation. Git history preserved via `git mv`.

### Moved (via `git mv`)
- `lib/builder/themes/` → **`themes/`** and `lib/builder/industries/` →
  **`industries/`** — promoted to first-class top-level domains
  (`@/themes`, `@/industries`). `lib/builder/types.ts` remains their shared contract.
- `components/site/LeadForm.tsx` → **`components/forms/LeadForm.tsx`**.
- `components/JsonLd.tsx` → **`components/seo/JsonLd.tsx`**.
- All `@/…` import aliases rewritten accordingly; zero stale references.

### Added
- **`ARCHITECTURE.md`** (root) — implemented architecture (layers, directory map,
  data flow, dependency/import map), planned future architecture (per-module
  purpose/responsibilities/location/dependencies/phase), gap analysis, and a
  recommended implementation order.
- **`docs/`** — deep dives: `ai.md`, `builder.md`, `seo.md`, `api.md`,
  `testing.md`, `deployment.md`, `contributing.md`, `decision-log.md` (ADRs), and
  an index `README.md`.
- **`.github/`** — `workflows/ci.yml` (runs lint → type-check → test → build on
  push/PR), issue templates (bug/feature), and a PR template.
- **`.ai/`** — agent working memory (`state.md` pointer, `session-log.md`,
  `checkpoints.md`, `ai-memory.md`) that complements — never duplicates — the manifest.
- Updated `README.md`, `PROJECT_MANIFEST.md` (Phase 6 + "Planned / Not Yet
  Implemented" register), and `ROADMAP.md` (future modules mapped to folders).

### Deliberately unchanged (see `docs/decision-log.md`)
- `components/site/` (92 refs — rename adds no value), `lib/ai/cache/` (AI-coupled),
  `lib/api|forms|leads`, flat `templates/`, and **`app/` routing** (max SEO safety).
- **No empty folders or stub code** for unbuilt modules (Auth, Billing, CRM,
  Dashboard, Admin, Blog, Deployment, Media, Analytics, Logging) — documented only.
- `public/` not created (no static assets yet).

### Verified
- `lint` + `type-check` + `test` (17/17) + `build` (83 routes) all pass. The
  sitemap (66 URLs) and prerendered route table (71) are **byte-identical** to the
  pre-restructure baseline — routes and SEO fully preserved.

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
