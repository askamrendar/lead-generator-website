# PROJECT_MEMORY.md — Single Source of Truth

> **Read this file first, and usually only this file.** It is the canonical memory for
> the project. Everything else in `.claude/` and the root docs is a supporting reference.
> Update this file whenever a milestone finishes. Last updated: 2026-07-18.

---

## 1 · Project Overview
- **Name:** Lead Generator Website (product concept: "Local Sites Pro").
- **Objective:** turn a single business-info form into a complete, SEO-optimized,
  nationwide local-business website — then let users generate, edit, deploy, and take it live.
- **Business goals:** (1) generation quality that ranks; (2) breadth (industries/themes/
  templates from small additive files); (3) self-serve multi-tenant SaaS; (4) monetization
  (subscriptions + AI-usage credits) — *billing deferred by current policy*.
- **SaaS vision / user journey:** Login → Dashboard → **Create Website** → AI Wizard →
  Generated → **Website Workspace** → Visual Builder → Preview → Deploy → Connect Domain → Live.
- **Current status:** SaaS foundation complete through Phase 7.2.3 + a dashboard redesign;
  the functional value loop (AI generate → deploy → live) is scaffolded but not yet built.

## 2 · Current Version (honest)
| | |
| --- | --- |
| **Current working version** | **v0.8.0-alpha** — SaaS Foundation |
| **Release status** | **Prepared · gate-verified (76/76) · NOT yet published** (interrupted by a Claude Code classifier outage) |
| **GitHub production version** | **v0.6.0** (until v0.8.0-alpha is actually pushed) |
| **Current branch** | `feature/phase-7-visual-builder` (all Phase 7 work, uncommitted) |
| **Production branch** | `main` (at v0.6.0) |
| **Stable branch** | `stable/v0.6.0` (`stable/v0.8.0-alpha` = pending) |
| **Latest published tag** | `v0.6.0` (`v0.8.0-alpha` = pending) |
| **Repo** | github.com/askamrendar/lead-generator-website |
| **Stack** | Next.js 15 · React 19 · TS (strict) · Tailwind 3 · Zod · Auth.js v5 (next-auth beta) · Prisma 6 + PostgreSQL · Node 22 · `node --test` |

**Pending publish steps:** one release commit → fast-forward `develop` + `main` → cut
`stable/v0.8.0-alpha` → annotated tag `v0.8.0-alpha` → push → backup zip → verify remote.

## 3 · Development Timeline
- **Phase 0 — Setup:** structure, deps, TS/Tailwind/ESLint/Prettier, base docs.
- **Phase 1 (0.1.0) Generator Core:** `BusinessConfig` Zod schema + selectors; home/about/
  contact; `/services/[slug]`; `/locations/[state]/[city]`; deterministic content; sitemap/robots.
- **Phase 2 (0.2.0) Nationwide SEO:** geo taxonomy (county/ZIP/neighborhood); service×city
  ISR matrix; internal-link engine; expanded JSON-LD; sitemap 24→**66 URLs**.
- **Phase 3 (0.3.0) AI Content Engine:** provider-agnostic (openai/anthropic/gemini/
  openrouter/mock); versioned prompts; file+memory cache; deterministic fallback.
- **Phase 4 (0.4.0) AI Rendering:** `resolvePageContent` (cache-first, read-only); validation/
  repair; versioning/rollback; batch pregenerate.
- **Phase 5 (0.5.0) Website Builder:** 8 themes + `ThemeProvider`; 22 blocks + `BlockRenderer`;
  5 industry packs; 4 templates; `composePage`; live `/preview`.
- **Phase 5.5 (0.5.1) Hardening:** single-source site origin + build guard; `/api/lead`
  rate-limit + honeypot; unified cache freshness; `serverError`; first tests. Tag `v0.5.1`.
- **Phase 6 (0.6.0) Enterprise Restructure:** `themes/`+`industries/` to root; `docs/`, `.github/`
  CI, `.ai/`, root `ARCHITECTURE.md`; routes/SEO byte-identical. Baseline `main` `cf1cff1`, tag `v0.6.0`.
- **Phase 7.1 Auth + DB (Production Approved):** Auth.js v5 (Credentials + Google/GitHub, JWT,
  scrypt); Prisma 6/PostgreSQL; **Org→Workspace→Project→Website** + RBAC; register/verify/reset;
  middleware guard; Docker dev / Neon prod. Hardening: `trustHost`, enumeration-safe register.
- **Phase 7.2.0 Tenant Access:** `lib/auth/access` — pure engine + `require*Access` resolver +
  `*Scope` + `AccessError`/HTTP mapping. The ONE way to read tenant resources.
- **Phase 7.2.1 Auth UI:** `app/(auth)/` pages + `components/auth/`; toast, dark mode, `SiteChrome`.
- **Phase 7.2.2 Dashboard Foundation:** responsive shell, config-driven nav, switchers, `components/ui/*` primitives.
- **Phase 7.2.3 Website Manager:** `lib/websites/` service (via tenant-access), creation wizard,
  **Website Workspace** (per-site tabs). `Website` schema extended (migration 0002).
- **Dashboard redesign:** action-oriented home, ⌘K command palette (`lib/search/`), Settings IA,
  full website action set, wizard entry modes, deploy/domain UI shells. Tests **76/76**.

## 4 · Current Architecture
**Two layers.** (a) **Generation engine** (unchanged since v0.6.0): AI content/render, Website
Builder, themes, industries, templates, SEO — config-driven, offline-safe, zero circular deps.
(b) **SaaS layer** (Phase 7): auth, tenancy, dashboard, Website Manager, Website Workspace.

**Module map & ownership** (`Website` is the central aggregate; each module owns ONE responsibility, communicates via services):
- **Authentication** — Auth.js v5 (JWT), `lib/auth/{config,auth,session,password,tokens,providers}`.
- **Authorization / RBAC** — `lib/auth/permissions/{roles,rbac}` + **Tenant Access** `lib/auth/access` (`require*Access`, `*Scope`, `AccessError`). *Never bypass.*
- **Tenancy** — `Organization → Workspace → Project → Website` (Prisma). `lib/dashboard/context.ts`.
- **Dashboard** — `app/dashboard/`, `components/dashboard/`, `components/ui/*`.
- **Website Manager** — `lib/websites/service.ts` (the ONLY read/write path), `components/websites/`.
- **Website Workspace** — `app/dashboard/websites/[websiteId]/` tabs (Overview/Builder/AI/Pages/SEO/Deploy/Domains/Media/Analytics/Versions/Settings).
- **Builder** — `lib/builder` + `components/blocks`/`builder` (edits **pages only**; owns nothing else).
- **SEO Engine** — `lib/seo` + `components/seo/JsonLd`. **Content/AI Engine** — `lib/ai/*`.
- **Theme/Template/Industry** — `themes/`, `templates/`, `industries/` (+ builder registry `lib/builder/registry`).
- **Deployment / Domains / Media / Analytics** — **placeholders / UI shells** (Phase 8+); Deployment uses an approved provider abstraction; Builder must never know deployment details.
- **Search** — `lib/search/` + `components/dashboard/CommandPalette` (⌘K, tenant-scoped, extensible).

**Dependency direction:** routing → presentation → domain engines → content/rendering →
platform (`lib/api`, `lib/auth`, `lib/db`, `lib/site.ts`) → config. Engines never import auth.

## 5 · Folder Responsibilities
- `app/` — routes: marketing (`/`, services, locations, generate, preview), `(auth)/`, `dashboard/`, `api/`. Special files: layout, sitemap, robots, manifest.
- `components/` — `ui/` primitives · `dashboard/` shell · `auth/` · `websites/` · `layout/` (+ `SiteChrome`) · `blocks/`+`builder/` · `forms/` · `seo/` · `site/` · `theme/`.
- `lib/` — `auth/` (+ `access/`) · `db/prisma.ts` · `dashboard/` · `websites/` · `search/` · `ai/` · `api/` · `builder/` · `generator/` · `seo/` · `forms/` · `leads/` · `site.ts` · `utils.ts`.
- `themes/` (8) · `industries/` (5) · `templates/` (4) — additive builder assets.
- `data/business.ts` — the sample `BusinessConfig`. `prisma/` — schema + migrations (0001, 0002).
- `tests/` — `node --test` pure-logic suites (76). `docs/` — deep dives + decision log.
- `.claude/` — AI operating system (this file is canonical). `.ai/` — session working memory. `.github/` — CI.

## 6 · Current Features
**Complete:** marketing site (SEO/sitemap 66/JSON-LD 4) · auth (register/login/logout/verify/reset,
scrypt, JWT) · multi-tenancy + RBAC + tenant-access · dashboard shell (responsive, dark mode, ⌘K) ·
Website Manager (CRUD, wizard, actions) · Website Workspace (tabs) · settings IA · command palette.
**Partial / shells:** dashboard metrics (honest placeholders) · Deploy/Domains tabs (UI only) ·
Settings sections (mostly read-only) · wizard entry modes (AI auto-fill deferred).
**Planned:** AI website generation · Visual Builder · Deployment providers · Domains · Media ·
Analytics · Versions · Blog · Prompts Library · Marketplace · Team · Billing (deferred).

## 7 · Pending Features (prioritized)
- **P0:** publish v0.8.0-alpha; formalize/harden Website Workspace Overview.
- **P1:** BYO API-key storage (OpenRouter/Netlify) + wire Settings; editable Account; AI Website Generator.
- **P2:** Visual Builder; Deployment engine; Domains; build-usage metrics; read-only usage/plan panel.
- **P3:** Media · Analytics · Versions · Blog · Prompts · Marketplace · Team.

## 8 · Roadmap
- **Current milestone:** Phase 7.2.3 complete + dashboard redesign (working v0.8.0-alpha).
- **Next milestone:** **Phase 7.2.4 — Visual Builder** (canonical). *Audit alternative:* first
  harden Website Workspace + add BYO keys + AI Generator so the core value loop works — confirm with user.
- **Long-term:** 7.2.4 Builder → 7.2.5 AI Generator → Phase 8 Deployment → 8.5 Domains →
  8.x Blog/Media/Analytics/Prompts → 9 Marketplace → 10 Team. (See `.claude/roadmap.md`, `NEXT_RELEASE_PLAN.md`.)

## 9 · Coding Standards
Reuse-first, composition over duplication. Strict TS, `@/*` alias, DRY, SOLID (esp. SRP + Open/
Closed — extend via registries/config, don't modify). No circular deps. **Builder stays
independent (edits pages only).** Deployment uses the provider abstraction. Single sources of
truth: site origin (`lib/site.ts`), business config (`data/business.ts`), cache freshness
(`lib/ai/cache/freshness.ts`), tenant access (`lib/auth/access`). Keep build green
(lint→type-check→test→build). Preserve route/sitemap(66)/JSON-LD(4) invariants. Pure logic is
unit-tested (`node --test`); pure modules imported by tests use relative `.ts` value imports.

## 10 · Git Workflow
`feature/* → develop → main`; `stable/*` snapshots per release; annotated tags `vX.Y.Z`; local
backup zips in `Release Backups/` (exclude `.git`/`.next`/`node_modules`). **Never** commit/push/
tag/merge without explicit user approval; never plain `--force` (use `--force-with-lease` only if
required); never delete history/old tags. `.env*` never committed.

## 11 · Known Issues / Debt / Blockers
- **Release publish pending** (classifier outage) — v0.8.0-alpha not on GitHub yet.
- BYO API keys not stored; Settings mostly read-only; no billing (deferred).
- Deploy/Domains/AI/Media/Analytics/Versions/Blog = placeholders/shells (Phase 8+).
- Rate-limit + AI cache per-instance (need Redis for horizontal scale); no queue for long AI/deploy jobs.
- Testing = pure logic only; component/DOM tests backlog (`T-002`). DB migration must be run per-env.

## 12 · Lessons Learned (why)
- **Auth.js v5 + JWT + scrypt** — App-Router-native; Credentials forces JWT; scrypt avoids a native dep.
- **Prisma 6 (not 7)** — `@auth/prisma-adapter` peer-supports ≤6.
- **Central tenant-access layer** — one authorization vocabulary; cross-tenant reads return `NOT_FOUND`
  (tenant-hidden), fail-closed; prevents ad-hoc `where` leaks.
- **`Website` as central aggregate** — every module attaches to it; Builder stays one module.
- **Pure-core + thin-adapter** pattern — keeps logic unit-testable under the zero-dep runner.
- **`SiteChrome`** hides marketing chrome on app routes without moving SEO-critical routes.
- **Multi-tenant superset** — reference product is single-account; we keep multi-tenancy and can hide switchers for single-workspace users.

## 13 · Current Session Summary
Built the entire SaaS foundation on top of v0.6.0: Phases **7.1 → 7.2.3** + a dashboard redesign.
Added `lib/auth` (+`access`), `lib/db`, `lib/dashboard`, `lib/websites`, `lib/search`, `prisma/`
(schema + migrations 0001/0002), `app/(auth)/`, `app/dashboard/**`, and many `components/{ui,
dashboard,auth,websites,theme}`. Ran the app locally (installed Homebrew Postgres, migrated,
registered/logged-in/verified end-to-end). Produced audits (architecture, UX vs "Local Sites Pro"
reference) and a demo walkthrough. **Approved:** all milestone plans + the v0.8.0-alpha release.
**Pending:** the git publish of v0.8.0-alpha (blocked by classifier outage). Gates green (76/76,
sitemap 66, JSON-LD 4). No billing built (policy).

## 14 · Next Immediate Task
**Railway live re-test of the True AI Website Generator** (built + gate-verified locally 2026-07-16, see §18/§19):
set `AUTH_URL=https://<public-origin>` (and `NEXT_PUBLIC_SITE_URL`) on Railway, redeploy, and re-run the
"Empire Plumbing NYC" UAT — builder preview must show Empire/New York, `/sites/<id>` must serve every page,
Deploy (zip) must yield a browsable static archive, a verified domain must serve the site. Then the remaining
TODO.md items (verification-email honest copy [MEDIUM]) and Phase 10 provider wiring + deferred code-only debt.
Housekeeping: git publish still awaiting explicit approval.

### (superseded) previous Next-Task
**Production Stabilization Mode** (per 2026-07-11 audit). No new features. Address the audit's Phase A
(critical-before-deploy) items — most urgent: **in-product AI Generator is still a placeholder** (core value
loop not wired); media is **local-filesystem only** (breaks on serverless/multi-instance); deployments run
**synchronously in the request** (should use the Phase 8.5 queue); rate limiter + event bus are **in-memory
per-instance**. Then: Phase 10 API Platform → 10.5 Hardening → 10.6 SaaS Ops → RC → v1.0. Housekeeping:
git-publish deferred until explicit approval. See §18 for the Phase 9 verified entry and audit summary.

### (superseded) previous Next-Task
**Phase 9 — Single-User Productivity** — ✅ VERIFIED COMPLETE 2026-07-11 (all six gates green; see §18).
Team Collaboration permanently removed. Then: 10 API Platform → 10.5 Hardening → 10.6 SaaS Operations → RC → v1.0.

### (superseded) previous Next-Task
**Phase 8.5 — Background Infrastructure** — ✅ done 2026-07-11 (see §18). Roadmap note: Phase 9 is now
Single-User Productivity (Team Collaboration removed — keep architecture extensible).

### (superseded) previous Next-Task
**Phase 8.4 — Analytics** (traffic, rankings, leads, conversions, calls, forms, GA4, Search Console, top
pages/keywords, Core Web Vitals, index coverage, website/workspace/org analytics, AI + deployment usage,
CSV/PDF export, trend charts). Independent module, tenant-access-guarded; external providers (GA4/GSC)
credential-gated. *Verified this roadmap:* 7.2.5 ✅, 8.0 ✅, 8.1 ✅, 8.2 ✅, 8.3 Blog ✅ (gates green,
test 104/104). Then: 8.5 Background Infra → 9 Team → 10 API Platform → hardening → RC. Housekeeping:
git-publish v0.8.0-alpha.

## 15 · AI Resume Instructions (every future session)
1. **Read `PROJECT_MEMORY.md` first** — it is the single source of truth.
2. Do **not** scan the repository; inspect only files required for the requested task.
3. Do **not** reread documentation already summarized here.
4. **Preserve the architecture** and every rule in §9; **reuse existing modules** (don't duplicate).
5. Never bypass `lib/auth/access`; keep `Website` the aggregate; Builder edits pages only.
6. Keep the build green and route/SEO invariants intact; get approval before any git write.
7. **Update this file (`PROJECT_MEMORY.md`) whenever a milestone finishes or version changes.**

---

## 16 · Permanent Rule — Definition of Done
**No feature, no milestone, and no release is considered complete until `PROJECT_MEMORY.md`
has been updated** (its Release / Milestone / Session logs appended) AND the four gates
(`lint` · `type-check` · `test` · `build`) have actually passed. Never mark work "done"
or record it as verified on gate results that were not run.

## 17 · Release Snapshot Log (append-only; newest first)
> Template — copy for each published release:
> `Version · Date · Git Tag · Branch · Stable Branch · Production Branch · Release Status ·
> Quality Gates · Architecture Score · Production Readiness · Modules Completed · Known Issues · Next Target`

- **v0.8.0-alpha** — 2026-07-10 · tag **pending** · branch `feature/phase-7-visual-builder`
  · stable **pending** (`stable/v0.8.0-alpha`) · production `main`(v0.6.0) · **Release Status: PREPARED, NOT PUBLISHED**
  · Gates: green at dashboard-redesign (76/76) — **Builder work added since is UNVERIFIED**
  · Arch 9 · Prod-readiness 7 · Modules: auth, tenancy, dashboard, website manager/workspace, command palette
  · Known issues: git publish pending (classifier outage); Builder unverified · Next: verify + publish.
- **v0.6.0** — 2026-07-09 · tag `v0.6.0` · `main` `cf1cff1` · `stable/v0.6.0` · **PUBLISHED**
  · Gates green · Arch 9 · Enterprise restructure baseline.

## 18 · Milestone Log (append-only; newest first)
> Template: `Milestone · Objective · Files Changed · Architecture Decisions · Lessons Learned · Technical Debt · Next Milestone`

- **UX round: ZIP download + Site Editor + Cloudflare domains** — ✅ VERIFIED (2026-07-19): all four gates green
  (lint · type-check · test **181/181** (+6) · build 95 pages incl. new `/editor/[websiteId]` route) + local prod-server
  E2E: editor 200 authed / 307→login anon; Builder tab 308→`/editor/<id>`; DB-seeded overrides rendered on served
  pages (home h1 + service seoTitle replaced, other pages untouched); Overview "Download ZIP" → 200 application/zip.
  *Objective (user-reported issues from production UI):* (1) no ZIP download after generation; (2) Builder cramped
  inside dashboard chrome, only edits a home draft the served site never reads, no page navigation; (3) domains UX
  told users to point DNS at placeholder `app.localsitespro.com`/Vercel IP `76.76.21.21` — Cloudflare flow needed.
  *Files added:* `lib/websites/content-overrides.ts` (pure zod: per-page copy patch keyed by site path; merge
  `applyPageOverride` — empty values never override; structural fields rejected), `lib/websites/editor-service.ts`
  (ONLY read/write path for `Website.contentOverrides`; lists pages via new `enumerateContentPages`),
  `app/editor/[websiteId]/{page,actions}.ts` + `components/editor/SiteContentEditor.tsx` (FULL-PAGE editor outside
  the dashboard shell — SiteChrome bares `/editor`, middleware auth-guards it; sidebar lists ALL pages grouped
  core/services/areas with override dots, per-page CMS form with generated copy as placeholders, save/reset,
  per-page preview link), migration `0011_content_overrides` (Website.contentOverrides JSONB),
  `tests/content-overrides.test.mjs` (+6). *Files modified:* `lib/htmlgen/engine.ts` (opts.overrides merged in the
  ONE `content()` helper — live/hosted/export all inherit; +`enumerateContentPages` so the editor shares the route
  map), `render-service.ts` (SiteBundle +contentOverrides, parsed defensively), builder tab → redirect to editor
  (old block Builder edited a dead draft; stack kept for a future visual mode), `WebsiteActions` (Preview + Download
  ZIP now real; "Edit site content"), Overview (+Preview/+Download ZIP buttons, plain `<a>` — Link would prefetch
  the export), DeploymentDashboard (export rows show a labeled Download icon), `lib/domains/dns.ts` (expectedRecords
  now REQUIRES appHost; apex = CNAME to the real platform host — Cloudflare flattens; NO hardcoded IPs),
  `lib/domains/service.ts` (platformHost() from RAILWAY_PUBLIC_DOMAIN else NEXT_PUBLIC_SITE_URL), DomainManager
  (copy buttons, Cloudflare grey-cloud-until-verified guidance, self-hosting note: download ZIP + point DNS at your
  own server), domains-dns tests updated (no-IP invariant). *Decisions:* content overrides over builderConfig —
  pages stay DERIVED (template switching/regeneration keep working, no stored HTML); editor at top-level `/editor`
  for full viewport (matches user's LeadsXPro reference: page list left, content form right). *Tech debt:* overrides
  are copy-only (no per-page image/layout control); old builder stack now unreachable from UI (delete later);
  ContentItem "Pages" tab still blog-only. *Next:* deploy + Railway re-verify; migration 0011 auto-applies via
  Dockerfile `prisma migrate deploy`.

- **Template 2 + HTML pack registry (multi-template serving)** — ✅ VERIFIED (2026-07-18): all four gates green
  (lint · type-check · test **175/175** (+19) · build, app sitemap 66) + local runtime E2E on a prod server (:3333):
  Template 2 site served every page 200 (home/about-us/contact-us/services/3× per-service/near-me/2× per-area +
  per-site sitemap.xml 10 URLs + robots.txt); template switching via `Website.templateId` verified both directions;
  custom-domain hosting verified (verified ACTIVE domain → 200, `class="t2"`, canonical = domain) incl. the
  middleware asset carve-out (`/templates/**` no longer host-rewritten — fixes pre-existing royal-oak CSS 404 on
  custom domains); ZIP export = 10 HTML pages + only template-2 assets, depth-relative `../../assets/` links;
  Template 1 export regression green (royal-oak bundle intact); lead form + honeypot posts 200 with HTML thank-you;
  zero external resources / zero JS (JSON-LD only) / no iframes on Template 2 → no CSP violations (verified against
  the served CSP header). *Objective (user directive):* second HTML template pack inspired by unclognyc.com
  (inspiration ONLY — no copied copy/images/branding; tests assert no reference strings leak), generic across all
  industries, fully data-driven (N services → N cards + N pages; areas only from user locations; empty
  reviews/faqs/stats/areas hide their sections), user-facing template names sequential ("Template 1"/"Template 2" —
  never business names). *Files added:* `templates/html/types.ts` (PackChrome/PackPageMeta/PackCard/
  HtmlPackRenderer/HtmlPack — the platform↔pack contract: platform owns routing/SEO/content/JSON-LD/sitemap, packs
  own markup only), `templates/html/registry.ts` (template-1=royal-oak, template-2; alias `royal-oak→template-1`
  read-side, NO migration; resolveHtmlPackId defaults template-1; isHtmlPackId strict for setters),
  `templates/html/article.ts` (shared articleHtml, moved from engine), `templates/html/royal-oak/pack.ts`
  (compositions moved verbatim from engine — byte-identical output + new OG/Twitter meta),
  `templates/html/template-2/{sections,pack}.ts` (pure string-builders: utility bar, sticky header, CSS-checkbox
  mobile nav, dropdowns ≤8 items else index-link (nav scales to any N), hero+badges+lead form, trust strip, card
  grids (auto-fill), why-us, reviews, details/summary FAQ, CTA band, contact (no map iframe — CSP), footer, sticky
  mobile call bar), `public/templates/template-2/assets/css/site.css` (single 12.6 KB sheet, system fonts,
  `--primary/--accent` from brand HSL), `tests/{html-registry,template-2}.test.mjs` (+19: cardinality 5/15,
  escaping, honeypot, OG/Twitter/canonical, conditional sections, nav adaptation, no-reference-leak, ZIP asset
  contract, royal-oak meta regression). *Files modified:* `lib/htmlgen/engine.ts` (pack dispatch via
  `opts.templateId`; chrome +category/tagline/appOrigin/hoursHtml; routes/content/SEO strings unchanged),
  `lib/websites/render-service.ts` (SiteBundle +`htmlTemplateId` from RAW row.templateId — NOT selectBuild's block
  id — with wizard brand fallback), `lib/export/static-site.ts` (pack assetDir), `lib/websites/generate-service.ts`
  (stores resolveHtmlPackId(w.templateId ?? wizard brand.templateId) — preserves choice across regeneration; no
  more 'royal-oak' hard-stamp), `lib/websites/schema.ts` (brand +templateId enum default template-1 — never enters
  generator BusinessConfig → AI cache hash stable), wizard Brand-step picker cards + Review row, Settings "Design"
  card + `setWebsiteTemplate` service/action, `middleware.ts` matcher +`templates/` exclusion, royal-oak
  `sections.ts` pageShell +OG/Twitter, SEO tab passes templateId. *Decisions:* per-page renderer interface (not
  shared section taxonomy) since pack designs differ structurally; registry uses relative `.ts` imports for the
  node --test type-stripping runner; WebsiteSettings keeps a local TEMPLATE_OPTIONS list (importing the registry
  would ship pack markup to the client bundle). *Tech debt:* Template 2 hero uses a CSS gradient/`heroImage`
  background (no `next/image` — string-built HTML); block-template registry ids ('base' etc.) still land in
  `Website.templateId` for pre-existing rows — resolved to Template 1 read-side; Lighthouse not yet formally run
  (static no-JS output should score high; measure on a live origin). *Next:* Lighthouse audit on a deployed
  Template 2 site; more packs as siblings; template thumbnails in the picker.

- **Royal-Oak HTML template — the ONE site template (user-provided design)** — ✅ VERIFIED (2026-07-17): all six
  gates green (test 156/156, app sitemap 66) + local runtime E2E (royal-oak site served for Peach State Electric:
  home/about-us/contact-us/services/per-service/near-me all 200, **/sitemap.xml (10 URLs) + /robots.txt served
  per-site**, bogus 404; export ZIP = 11 HTML pages + full asset bundle with depth-relative links; browser
  screenshots confirm the original design: sticky blue nav, hero + Get-Free-Quote form, process/why sections).
  *Objective (user directive):* replace ALL previous block templates/website data with a single template cloned
  section-by-section from `royaloakmoldremoval.com-static-website.zip` (~/Downloads/Website backup); more packs
  to come later; per-site sitemap required. *Files added:* `templates/html/royal-oak/sections.ts` (pure string
  section builders ported from the original markup: pageShell head/header/footer chrome, hero+lead-form, inner
  banner, feature-s6 services grid, content article, cta-small band, owl-carousel testimonials, details/summary
  FAQ, bottom CTA, contact info+form+map; brand colors via the original `--primary/--secondary` CSS vars from
  BusinessConfig HSL; third-party leadsmart iframe REPLACED with a plain form → our /api/lead),
  `lib/htmlgen/engine.ts` (BusinessConfig → full HtmlSite: /, /about-us, /contact-us, /services,
  /services/<svc>, /near-me, /near-me/<area> (neighborhoods, else cities), per-site sitemap.xml + robots.txt;
  copy from the EXISTING resolvePageContent — AI-cached or deterministic), `public/templates/royal-oak/assets`
  (original css/js/fonts bundle, 3.2 MB — served by Next static + copied into exports). *Files replaced:*
  `/sites` + `/hosted` page.tsx → **route handlers** returning template HTML (published public / draft
  owner-only 404; hosted = canonical domain origin + 308 redirectTo; s-maxage=300), `lib/export/static-site.ts`
  (direct htmlgen render — self-fetch machinery GONE; assets bundled from public/), SEO tab page-map reads
  htmlgen, generation stamps `templateId='royal-oak'`. *Deleted:* `components/site-render/*`,
  `lib/export/static-blocks.tsx`. Old block-template registry stays (Visual Builder still edits the draft doc)
  but no longer serves sites. *Decisions:* sections as typed string-builders (not tokenized raw HTML) so AI/
  deterministic content feeds them; areas = neighborhoods-first fallback cities (mirrors the original's
  near-me IA). *Tech debt:* hero background is a brand-gradient when no heroImage; testimonials carousel uses
  the template's owl JS; Visual Builder edits don't yet affect the served HTML (template is config+AI-driven).
  *Next:* Railway deploy + live re-test; more template packs as `templates/html/<name>` siblings.
- **In-process background worker (zero-cron job processing)** — ✅ VERIFIED (2026-07-17): all six gates green
  (test 151/151, sitemap 66) **+ live runtime proof**: queued a `blog.generate` job with NO manual worker call →
  the inline worker picked it up automatically within one 5s tick → SUCCEEDED, article created ("Panel Upgrades:
  What You Need to Know"). *Objective:* close the "Running background worker — needs external cron" blocker for
  long-lived deployments (Railway/Docker): generation jobs previously sat QUEUED forever unless something POSTed
  `/api/jobs/run`. *Files:* `instrumentation.ts` (Next 15 native hook; when `NEXT_RUNTIME==='nodejs'` and
  `JOBS_WORKER_TOKEN` is set, an interval self-fetches the app's OWN token-gated `/api/jobs/run` over loopback —
  the single existing worker implementation; `WORKER_INLINE=0` opts out, `WORKER_INTERVAL_SECONDS` tunes cadence,
  default 15s; ticks serialized, errors log-only), `.env.example` (+worker envs). *Decision — self-fetch, not
  direct import:* Next bundles `instrumentation.ts` for every runtime and webpack REJECTS `node:` schemes in that
  bundle (`UnhandledSchemeError`); importing `lib/jobs/handlers` transitively pulls `node:crypto`/`node:fs` and
  breaks the build. Looping over HTTP reuses the endpoint's auth/maxDuration/reaper semantics and keeps external
  cron + inline worker safe together (atomic QUEUED→RUNNING claim). *Deployment note:* Railway already has
  `JOBS_WORKER_TOKEN` set → worker turns on automatically at next deploy; serverless (Vercel) stays on external
  cron. *Lessons:* instrumentation runs in BOTH runtimes' bundles — anything Node-only there must be reached via
  fetch or guarded dynamic import of webpack-safe modules only. *Next:* Railway live re-verify (generate → auto-
  process without curl).
- **BYO AI keys + AI images + all-SOON-removed (first-time AI onboarding)** — ✅ VERIFIED (2026-07-17): all six
  gates green (test 151/151, sitemap 66) **+ full browser-driven E2E via Chrome DevTools Protocol on a prod
  server**: real UI login → Settings → AI Providers → saved an Anthropic key (stored `enc:v1:` encrypted,
  masked display, Disconnect works, invalid-key "Test connection" surfaces the provider 401 live) → created
  "Peach State Electric" (Georgia) through the REAL wizard UI (state dropdown "Georgia (GA)", city autocomplete,
  additional cities Marietta+Roswell) → clicked "Generate website" → worker ran → GENERATED
  (electrical industry auto-selected) → published → all pages 200 incl. per-extra-city routes; workspace
  Deployments/Domains/AI-Generator hubs render real data. *Objective:* first-time users must be able to
  configure an AI API key in-product (was env-only), AI should generate content AND images, and every "Soon"
  placeholder had to become real. *Files added:* `lib/ai/credentials-context.ts` (AsyncLocalStorage BYO-key
  scope; `getAIConfig`/`getProviderKeyEnv` consult it first, env fallback, mock last — engine call sites
  unchanged), `lib/ai/credentials.ts` (workspace-scoped save/read/clear/test; key AES-encrypted into
  `WorkspaceSettings.metadata.aiCredentials` — NO migration; `withWebsiteAiCredentials` resolves website→
  workspace key for job handlers; live test-connection makes a real 1-token completion),
  `lib/ai/services/image-gen.ts` (OpenAI gpt-image-1 + Gemini Imagen-3 via fetch; anthropic/openrouter skip
  gracefully), `app/api/sites/[websiteId]/asset/[assetId]/route.ts` (public tenant-asset serving:
  published→public else owner-only, asset must belong to the website's workspace, fail-closed 404),
  `components/dashboard/AiProviderForm.tsx` + real `settings/ai-providers` page + actions. *Files modified:*
  `generate-service` (whole core wrapped in workspace creds; hero image generated best-effort after content-
  warm → media library via new `uploadAssetCore` → `brand.heroImageUrl` root-relative path; never fails the
  build), `blog/service` generateOneCore (creds-wrapped), `media/service` (+`uploadAssetCore`,
  `readAssetBytesCore`), generator schema `heroImage` now accepts root-relative paths, wizard brand schema
  +`heroImageUrl`, adapter maps it, AiGenerator tab (first-time "Connect AI provider" CTA → settings; banner
  reflects workspace key), wizard start-step copy updated (was "ships in 7.2.4"), **all nav SOON flags removed**
  (Websites/AI Generator/Deployments/Domains/Settings ready; website tabs Builder/Pages/SEO/Deployments/
  Domains/Media/Analytics ready), real workspace hub pages for AI Generator/Deployments/Domains, real
  per-website SEO tab (route map + keywords + open-page links), Settings Domains/Notifications placeholders →
  real pointers; deleted `/dashboard/api-keys` + `/dashboard/settings/api-keys` (unbuilt platform API — removed
  from nav rather than stubbed). *Research decision:* BYO-key via AsyncLocalStorage beats per-call threading
  (0 engine signature changes) and env-mutation (request-unsafe); keys live at WORKSPACE level (tenant boundary,
  one key covers all sites, matches the existing metadata JSON column). *Lessons:* (1) FormField injects ids
  via cloneElement — wrapping a control in a fragment breaks the injection (city field got no id → wizard
  validation failed); (2) stale `.next/types` after deleting a route dir fails type-check — clear it.
  *Tech debt:* service/city images still placeholder tiles (hero only); test-connection costs one real token;
  image-gen is single-shot (no retry). *Next:* Railway re-test with SECRET_ENCRYPTION_KEY set.
- **True AI Website Generator (M1–M7) — multi-page tenant sites, hosting, static export** — ✅ VERIFIED
  (2026-07-16): all six gates green (test **142/142** (+6 export), sitemap 66, build 95 pages) **+ live runtime
  E2E on a prod server (:3210)**: published tenant site served all page types (home/about/contact/faq/privacy/
  terms/service/city/serviceCity) with the TENANT's data (no Apex/Austin leak); draft site 404 to anonymous;
  bogus path 404; **custom-domain hosting verified** (Host: empireplumbing.example.com → 200, tenant title,
  root-relative links, canonical = custom domain; unknown host → 404); **static ZIP export verified** (real
  `application/zip`, 11 HTML pages + assets/site.css + favicon.svg + robots + sitemap, zero JS, JSON-LD kept,
  `<details>` FAQ, plain `<form action=<app>/api/lead>`). *Objective:* close the TODO 2026-07-16 UAT criticals —
  feed the existing engine EVERY tenant's business (never duplicate). *Architecture (per
  docs/ARCHITECTURE_WEBSITE_GENERATOR.md, written before implementation):* pages are deterministic functions of
  (template, businessConfig) → no new storage/migration; one bridge service enumerates+renders routes on demand.
  *Files added:* `lib/websites/render-service.ts` (websiteBusiness/websiteRoutes/matchRoute/renderSitePage +
  SiteBundle loaders), `lib/websites/legal-pages.ts` (deterministic privacy/terms via existing rich-text block),
  `app/sites/[websiteId]/[[...slug]]/page.tsx` (M3 preview/serving surface; published=public, else owner-only
  fail-closed 404; noindex; `?static=1` renders the no-JS variant), `app/hosted/[host]/[[...slug]]/page.tsx`
  (M5 custom-domain surface; verified+ACTIVE+PUBLISHED gate; redirectTo hop; ISR 300s; indexable),
  `components/site-render/{SiteShell,SitePageView}.tsx` (tenant chrome — plain `<a>` links, shared by hosted +
  export), `lib/export/{zip,favicon}.ts` (pure dependency-free STORE-ZIP writer + CRC32; deterministic SVG
  favicon; `tests/export-zip.test.mjs` +6), `lib/export/static-blocks.tsx` (no-JS lead-form/FAQ substitutes),
  `lib/export/static-site.ts` (M4: export **self-fetches** `/sites/<id>/<path>?static=1` with the caller's
  cookie, strips Next runtime scripts (keeps JSON-LD), inlines build CSS, unwraps `/_next/image`, rewrites links
  root-relative, zips). *Files modified:* PageType +`contact`/`faq` end-to-end (types, context builders, agents,
  prompt TASKs, deterministic content, base template layouts, builder registry — compiler-enforced),
  `middleware.ts` (foreign Host → rewrite `/hosted/<host>/<path>`, Edge-safe no-DB; auth guard unchanged; API
  paths never rewritten), `lib/builder/editor/preview-context.ts` + `builder-service.ts` seed + builder page (M1:
  preview/seed from the WEBSITE'S OWN config; sample only as last-resort fallback), `components/builder/
  BlockRenderer.tsx` (+`overrides` prop), `app/api/websites/[websiteId]/export/route.ts` (real static-site ZIP;
  `?format=config` keeps the JSON bundle), `app/api/lead/route.ts` (accepts form-encoded posts from exported
  sites → HTML thank-you; JSON path unchanged), `lib/websites/generate-service.ts` (M6: warm per-website AI
  content cache via existing `generateWebsite(business,'core')` when a key is configured; silent skip offline),
  AI Generator tab (M6/M7: honest offline/live banner + per-website image-prompt pack with copy buttons from the
  existing image-prompt engine), `app/layout.tsx` + `SiteChrome` (marketing JSON-LD/brand CSS moved into a `seo`
  slot rendered ONLY on marketing routes; `/sites`+`/hosted` pass through fully unwrapped), zip deployment
  provider copy honest ("static site archive"), tenant-site metadata uses `title.absolute` (no `%s | Apex`
  template leak). *Lessons:* (1) `renderToStaticMarkup` cannot render client-reference components (next/link)
  from an RSC route — export by SELF-FETCHING the live route instead (guarantees export ≡ hosted, byte-for-byte
  pipeline); (2) tenant surfaces must escape the root layout's title template via `title.absolute` and skip the
  root layout's sample-business JSON-LD (the `seo` slot pattern); (3) root layout JSON-LD/brand CSS ride
  SiteChrome so path-aware exclusion needs no route-group moves. *Tech debt:* exported form posts to the app
  origin (set NEXT_PUBLIC_SITE_URL in prod or leads 404); hosted-surface ISR isS 5 min (no on-publish revalidate
  hook yet); export CSS is the whole app stylesheet (~250 KB, unpurged); sitemap/robots not yet served on the
  hosted surface (only in the export). *Next:* Railway re-test of "Empire Plumbing NYC" (AUTH_URL fix is env-only),
  remaining TODO UAT items (verification-email copy), then Phase 10 provider wiring.
- **Phase 11 — Production Deployment & UAT** — ✅ VERIFIED (2026-07-12): all six gates green (test **136/136**,
  sitemap 66) + a **real staging simulation** (production build served on :3100 against a fresh separate Postgres DB).
  *Objective:* prep for deploy, run full UAT, security/perf/a11y/SEO testing, produce a Go/No-Go report — no new
  features. *Done:* (1) fresh-DB migration path validated (all 10 migrations apply from empty); (2) full UAT battery
  live — auth (enumeration-safe register, weak-pw 422, dashboard 307→login, **rate-limit 429 after burst**),
  auto-provisioning (1 Org+1 Workspace+OWNER per user), **tenant isolation** (no cross-org membership path),
  AI generate via live worker (**GENERATED, 12 blocks**), blog generate (**ARTICLE created**), async deploy
  (QUEUED→READY re-verified), health probes (live/ready 200, metrics fail-closed 401→200), worker auth (401/200/503),
  **backup/restore proven** (pg_dump→restore→row counts matched), trash/restore, export 401-gated, accept-invitation
  410; (3) 12 marketing/SSG routes 200; SEO (sitemap 66, robots, 4 JSON-LD, noindex on auth); a11y (skip link, id=main,
  label association) confirmed in served HTML. *Changes (gate-verified):* **added CSP + HSTS + Permissions-Policy**
  security headers (`next.config.mjs`, 4→7 headers; verified non-breaking under CSP); **fixed a real bug** —
  `readAssetBytes` (`lib/media/service.ts`) used `findUniqueOrThrow` so `/api/media/[id]/raw` returned **500** for a
  missing id → now `findUnique`+null → **404** (fail-safe, no probing/noise). *Deliverables:* `docs/PHASE_11_DEPLOYMENT_UAT.md`
  (infra diagram, env checklist, rollback/monitoring/backup plans, Go/No-Go, launch checklist); refreshed
  `docs/DEPLOYMENT_PRODUCTION.md` §10. *Verdict:* **GO (conditional)** — code production-ready; activation gated on
  YOUR infra/creds (managed Postgres, the 4 REQUIRED + 3 fail-closed env vars, a worker cron, TLS/domain). *Lessons:*
  `findUniqueOrThrow` on a public/raw-serve path turns a missing id into a 500 — use `findUnique`+null there; CSP with
  `'unsafe-inline'` script-src is required for Next's inline bootstrap + the theme/JSON-LD scripts (nonce-based CSP is a
  later hardening step). *Next:* production cutover when creds/infra are provided, or the deferred code-only debt (§ TODO.md).
- **Release Engineering: production audit + code-only hardening** — ✅ VERIFIED (2026-07-12): all six gates green
  (test **136/136**, sitemap 66) + async-deploy re-verified E2E after the changes. *Objective:* run a full 6-dimension
  production audit (6 parallel specialist reviewers over the real code) and apply every safe code-only fix; leave only
  external-credential/infra blockers. *Audit scores (0–100):* Production-readiness **78**, Architecture **86**, Code
  quality **86**, Maintainability **78**, Scalability **56→~70 after fixes**, Security **83→~88 after fixes**,
  Performance **68→~74 after fixes**, Database **74→~82 after fixes**, API **78→~84 after fixes**, UX/a11y/SEO **79→~85
  after fixes**. *Fixes applied this session (all gate-verified):*
  • **Security:** admin-gated the 3 anonymously-reachable AI diagnostic routes (`ai/status`,`ai/provider`,`ai/prompts`
  → fail-closed 503, runtime-verified); made `SECRET_ENCRYPTION_KEY` **fail-closed in production** (`encryptSecret`
  throws rather than silently storing plaintext; dev still passthrough) +2 tests; JSON-LD `<`-escaping defense-in-depth.
  • **Reliability/scalability:** **stuck-job reaper** (`reapStuckJobs` + pure `isStuck` policy +1 test; requeues/fails
  `RUNNING` rows past a visibility timeout — closes the CRITICAL "no crash recovery" gap) wired into the worker tick;
  `maxDuration=60` on `/api/jobs/run` so a hung handler can't overrun the platform limit.
  • **Database/perf:** migration **0010_job_website_index** — denormalized `Job.websiteId` (indexed) replacing the
  non-indexable `payload` JSON-path scan in `jobsForWebsite` (CRITICAL); added `@@index([status,startedAt])` for the
  reaper; removed dead `framer-motion` dep (0 imports).
  • **API:** uniform `guard()` on `jobs/actions.ts` (was missing try/catch — HIGH; raw errors reached client).
  • **A11y/UX:** modal **focus trap + focus restoration** (fixes Modal/Drawer/ConfirmDialog); **skip-to-main** links +
  `id="main"` on both shells; `LeadForm` label/error association (`htmlFor`+`aria-describedby`+`role=alert`); error
  toasts now `role=alert`/assertive; wizard stepper `aria-current="step"`; dark-mode error-text variants; mobile
  data-table `overflow-x-auto` (was clipping); sticky-call-bar `pb-16` clearance.
  *Deferred (documented, not silently skipped):* queue claim via `UPDATE…FOR UPDATE SKIP LOCKED` (perf, needs raw SQL +
  careful testing); intra-tick handler concurrency; batch `enqueueEach` with `createMany`; centralize the 12
  `as unknown as object` Prisma-JSON casts behind one `toJson<T>()` helper + Zod-on-read for blobs; dedupe
  credential-resolution + revision-cap helpers; job ownership-scoping on retry/cancel; integration/E2E harness (still
  100% pure-unit, now 136). These are the top of the tech-debt list (§ TODO.md) — none block the RC. *Next:* Phase 10
  provider wiring (all external-creds gated) + the deferred code-only debt above.
- **Release Engineering: async deployments (remove synchronous deploys)** — ✅ VERIFIED E2E (2026-07-12): all six
  gates green (test **133/133**, sitemap 66) **+ a real end-to-end runtime test** (seeded a QUEUED deployment + job →
  hit the token-gated worker `POST /api/jobs/run` on a live dev server → deployment transitioned **QUEUED → READY**
  with export URL + logs; job SUCCEEDED). *Objective:* the deployment service no longer runs any provider build inside
  a request — `createDeployment`/`retryDeployment` create a QUEUED `Deployment` row and enqueue a `deployment.run`
  job, returning immediately; the background worker runs the single build implementation. *Files changed:*
  `lib/deployment/service.ts` (removed `runDeploy`; added system cores `runDeployCore` (idempotent — only runs a QUEUED
  row, guards re-delivery) + `runDeployForWebsiteCore` (bulk) + shared `buildDeploymentInput` DRY helper; `createDeployment`/
  `retryDeployment` now enqueue; fixed a redundant double-decrypt in `providerHealth`), `lib/jobs/handlers.ts`
  (`deployment.run` handler now REAL — dispatches on `{deploymentId}` single vs `{websiteId}` bulk, was a stub). The
  existing `DeploymentDashboard` already spoke async ("Deployment started" toast, QUEUED pill, `router.refresh()`), so
  no UI change was needed; bulk deploy (`lib/productivity/bulk.ts`) keeps working via the `{websiteId}` path.
  *Decision:* rollback stays inline (a fast compensating action, not a build). *No circular dep:* deployment/service →
  jobs/service (leaf); jobs/handlers → deployment/service; jobs/service does not import deployment. *Next:* production
  audit (this session) → apply code-only Critical/High fixes → Phase 10 provider wiring (external-creds gated).
- **AI Generator batch + infra verification** — ✅ VERIFIED (2026-07-12): **ALL SIX GATES GREEN, self-run this
  session** — prisma generate · migrate deploy (0008_productivity + 0009_remove_team applied; the DB was behind) ·
  type-check · lint · test **124/124** · `ALLOW_LOCALHOST_BUILD=1` build (sitemap **66** URLs confirmed from the
  prerendered `.next/server/app/sitemap.xml.body`). *Objective:* clear the SESSION_HANDOFF §0 blocker and verify the
  previously-ungated AI Generator + production-infra batch (`lib/websites/{generate-service,business-adapter}.ts`,
  `lib/env.ts`, `lib/logger.ts`, health endpoints, `components/websites/AiGenerator.tsx`, `website.generate` handler).
  *Root causes fixed:* (1) the SESSION_HANDOFF §9 **`teamInvitation` type-check blocker was a stale generated Prisma
  client** — `npx prisma generate` regenerated it (no `teamInvitation` in the client) and type-check went green; there
  is NO root-level `tsconfig.tsbuildinfo` (only `.next/cache/.tsbuildinfo`), and NO Team refs remain in source
  (grep-verified). (2) The one failing test (`business-adapter.test.mjs` — "output is a valid generator config") was
  the adapter emitting `address.street: ''` which violates the generator schema's `z.string().min(1)`; fixed to an
  honest service-area line `` `${location.city} Service Area` `` (the wizard collects no street — service-area business
  model). *Cleanup:* deleted the truly-orphaned dead component `components/auth/AcceptInvitationForm.tsx` (only
  self-reference); KEPT the three Team redirect/410 stubs (`/(auth)/invitations/[token]`, `/api/auth/accept-invitation`,
  `/dashboard/team`) as graceful legacy-link handlers with zero Team coupling. *Lessons:* a `teamInvitation`-style
  "phantom" type error after model removal is a **stale generated client**, not necessarily a cache/duplicate — always
  `prisma generate` first. *Tech debt (Phase 10, external-creds-gated):* live provider SDKs (AI/cloud-deploy/GA4/GSC),
  object storage, async deploys onto the queue, distributed rate-limit/event-bus, integration/E2E tests. *Also
  completed + verified this SAME session (same green tree):* **secret encryption at rest** — `lib/security/secrets.ts`
  (AES-256-GCM via `node:crypto`, scrypt-derived key from `SECRET_ENCRYPTION_KEY`), wired into deployment provider
  creds (`lib/deployment/service.ts`: encrypt on write / decrypt on read+use) + domain provider creds
  (`lib/domains/service.ts`); dev-safe passthrough when no key, idempotent, fail-closed on missing key for an encrypted
  value; `tests/secrets.test.mjs` (+6 → **test 133/133**). Removed orphaned dead `AcceptInvitationForm.tsx`.
  *Next:* async deployments onto the queue (code-only) → Phase 10 provider wiring (external creds gate live cloud/AI).
- **Phase 9 — Single-User Productivity + Team removal** — ✅ VERIFIED COMPLETE (2026-07-11): **prisma generate ·
  migrate deploy (0008_productivity + 0009_remove_team) · type-check · lint · test 119/119 · production build —
  ALL SIX GATES GREEN** (gate output provided by user). *Objective:* single-user productivity features + permanent
  removal of Team Collaboration; reuse existing modules, no architecture redesign. *Files added (Phase 9):*
  `lib/productivity/{revisions,templates,service,bulk}.ts`, `lib/prompts/service.ts`, `lib/preferences/service.ts`,
  `tests/productivity.test.mjs`, `components/productivity/{WebsiteGrid,TrashList,PromptLibrary,PreferencesPanel,
  VersionHistory}.tsx`, `app/dashboard/{favorites,trash,prompts,preferences,tasks}/page.tsx` + `app/dashboard/
  {productivity,prompts,preferences}/actions.ts`, real `app/dashboard/templates/page.tsx` + website `versions` tab.
  *Files modified:* `prisma/schema.prisma` (+`UserPreference`,`Prompt`,`AiRun`; `Website`+`trashedAt/pinnedAt/
  favorite/lastOpenedAt/revisions`; `WebsiteStatus.TRASHED`), `lib/websites/{service,types,status,nav}.ts`,
  `lib/dashboard/nav.ts`, `lib/search/registry.ts`, `components/dashboard/{NotificationsButton,OrganizationSwitcher,
  WorkspaceSwitcher}.tsx`, `components/websites/WebsiteActions.tsx`. *Team removal:* deleted models `Team`,
  `TeamMembership`, `TeamInvitation` + `enum InvitationStatus` (migration `0009_remove_team`); removed Org/User
  back-relations; `/dashboard/team` + `/(auth)/invitations/[token]` → redirect stubs, `/api/auth/accept-invitation`
  → 410 (dirs to be deleted); `AcceptInvitationForm.tsx` orphaned (to delete). **KEPT (unchanged):** Organization,
  Workspace, Membership, Role enum, entire `lib/auth/access` layer, `provisionNewUser` (already gives each account
  exactly one Org + one Default Workspace + OWNER Membership). *Root causes fixed during verification:* (1) stale
  Prisma client (regenerated); (2) `restoreFromTrash`/`purgeWebsite` imported from wrong module; (3) `generateOneCore`
  used lowercase `'article'` → `'ARTICLE'`; (4) `usePrompt`/`usePromptAction` tripped react-hooks rule → renamed
  `markPromptUsed(Action)`; (5) two invitation files still queried `prisma.teamInvitation` → stubbed; (6) **build-only
  failure while type-check passed = stale root-level `tsconfig.tsbuildinfo`** (`incremental:true`; survives `rm -rf
  .next`) — cleared it. *Lessons:* `rm -rf .next` does NOT clear `tsconfig.tsbuildinfo`; a build-fails/type-check-passes
  split on the same file ⇒ stale incremental cache, not code. Postgres enum: adding + using a value needs separate
  transactions (0008 only adds, so OK). *Tech debt / known issues (from 2026-07-11 audit):* in-product AI Generator
  still a placeholder (core loop unwired); media local-fs only; deployments run synchronously (not on the queue);
  rate limiter + event bus in-memory/per-instance; no integration/E2E tests (unit only); provider live-integrations
  deferred (Phase 10); JSON-blob-heavy schema. *Next:* Production Stabilization (Phase A criticals) → Phase 10.
- **Phase 8.5 — Background Infrastructure** — ✅ VERIFIED (2026-07-11): lint · type-check · test 114/114
  (+6 jobs-policy) · build green. *Objective:* run everything asynchronous through a **durable, DB-backed
  job queue** with worker registry, scheduler/recurring jobs, retry/backoff, failed-jobs + history,
  per-queue monitoring, an in-process **event bus**, and a **notification center** — independent module,
  reused by (not coupled into) completed modules. *Files added:* `lib/jobs/{policy,queues,events,scheduler,
  service,handlers,notifications}.ts` · `app/api/jobs/run/route.ts` (worker entrypoint) ·
  `app/dashboard/jobs/{page,actions}.ts` · `app/dashboard/notifications/page.tsx` ·
  `components/jobs/{QueueDashboard,NotificationCenter}.tsx` · `tests/jobs-policy.test.mjs`. *Files modified:*
  `prisma/schema.prisma` (+`Job`, `Notification` models; `JobStatus`, `NotificationLevel` enums; `User.notifications`
  relation; migration `0007_jobs` applied) · `lib/dashboard/nav.ts` (+Background Jobs, +Notifications under
  Insights; **−Team** entry — Team Collaboration removed per single-user roadmap). *Features:* 9 named queues
  (ai/deployment/blog/analytics-sync/media-processing/image-optimization/email/notification/provider-sync),
  handler registry, enqueue + delay/scheduling, **atomic claim-and-run worker** (conditional `updateMany`
  QUEUED→RUNNING prevents double-processing), exponential backoff + max-attempts retry, manual retry/cancel,
  recurring scheduler (`ensureRecurring`: maintenance-cleanup daily, analytics-sync hourly), queue-health +
  job-history dashboard, notification center (success/error/warning/info, mark-read/all). *Decisions:*
  **serverless has no persistent worker** → durable queue + token-gated `POST /api/jobs/run` entrypoint driven
  by an EXTERNAL scheduler (Vercel Cron/curl); UI shows an honest "Worker awaiting configuration" banner when
  `JOBS_WORKER_TOKEN` is unset (fail-closed: route refuses without the token). Jobs run as the **SYSTEM** — the
  enqueue call site is the authorization point; handlers use direct data access, not per-request tenant-access.
  Pure retry/schedule math lives in `policy.ts` (relative `.ts` imports so Node's test loader resolves it).
  AI/email/provider-sync handlers return honest **awaiting-credentials** results (Phase 10) — never fabricated.
  *Lessons:* `serverError(context, err)` takes 2 args (fixed on verify); Prisma `Json` writes need
  `as unknown as object` (reused the deployment-service convention). *Tech debt:* no in-process daemon —
  continuous processing needs the external scheduler wired up; webhooks (outbound) and live AI/email/provider
  work await Phase 10 credentials; event bus is in-process (single-instance) — a cross-instance broker is a
  later concern. *Next:* Phase 9 Single-User Productivity.
- **Phase 8.4 — Analytics** — ✅ VERIFIED (2026-07-11): lint · type-check · test 108/108 (+4) ·
  build green; sitemap 66. *Objective:* read-only analytics; **real internal metrics computed from
  existing tables** (websites/deployments/content/media/domains), external traffic/rankings via GA4 +
  Search Console providers (credential-gated, Awaiting-Credentials). Independent module. *Files added:*
  `lib/analytics/{csv,types,providers,service}.ts` + `tests/analytics-csv.test.mjs` ·
  `components/analytics/{TrendChart,AnalyticsDashboard}.tsx` · `app/dashboard/analytics/page.tsx`.
  *Files modified:* `app/dashboard/websites/[websiteId]/analytics/page.tsx` (placeholder → real) ·
  `lib/dashboard/nav.ts` (+Analytics nav, Media→ready). *No migration* (metrics computed live).
  *Features:* metric tiles (websites/published/deployments/content/media/domains), deployment trend
  (real, bucketed by day, SVG chart — no chart dep), website-health score, date filters (7/14/30/90),
  CSV export (real, pure `toCsv`), PDF via browser print, external GA4/GSC providers + registry with
  Awaiting-Credentials state. Mounted at top-level `/dashboard/analytics` (workspace) + website Analytics
  tab. *Decisions:* compute from existing tables (no analytics store yet); external data never fabricated.
  *Tech debt:* traffic/sessions/keyword rankings/CWV/index-coverage/conversions/calls/forms need GA4/GSC
  credentials (Phase 10) + a sync job (Phase 8.5); AI/lead usage need instrumentation tables later.
  *Next:* Phase 8.5 Background Infrastructure.
- **Phase 8.3 — AI Blog Generator** — ✅ VERIFIED (2026-07-11): lint · type-check · test 104/104 (+5) ·
  build green; sitemap 66. *Objective:* generate SEO-ready content items (pages + articles) per website,
  reusing the AI Engine's offline-safe pattern + SEO helpers; never renders pages. Independent module.
  *Files added:* `lib/blog/{content-types,seo,generate,service}.ts` + `tests/blog-seo.test.mjs` ·
  `app/dashboard/websites/[websiteId]/pages/{page,actions}.ts` (real content manager) ·
  `components/blog/ContentManager.tsx`. *Files modified:* `prisma/schema.prisma` (+`ContentItem`,
  `ContentType`/`ContentStatus` enums, `Website.content`; migration `0006_content` applied). *Features:*
  14 content types (service/city/area/neighborhood/location/FAQ/comparison/educational/resource/
  case-study/press-release/landing/supporting/article), single + bulk generation, editor (title/body/
  tags/featured-image), auto SEO (title/description/word-count/reading-time/excerpt), draft/publish/
  schedule/archive status, duplicate, delete, revision history (capped 20). *Decisions:* deterministic
  baseline generation (AI provider upgrades via `lib/ai` when configured — app's offline-safe pattern);
  `featuredImageId` is a LOOSE ref to a MediaAsset (no FK → Blog ⊥ Media decoupled); content lives on the
  website Pages tab. *Tech debt:* live AI copy + featured-image auto-generation + scheduled auto-publish
  need Phase-10 keys / Phase-8.5 scheduler; blog *routes* (public rendering) are a later phase.
  *Next:* Phase 8.4 Analytics.
- **Phase 8.2 — Media Library** — ✅ VERIFIED (2026-07-11): lint · type-check · test 99/99 (+5) ·
  build green; sitemap 66. *Objective:* workspace-scoped DAM with a pluggable StorageProvider
  abstraction; reusable assets across a workspace's websites. Independent module. *Files added:*
  `lib/media/{kind,editor,service}.ts` + `lib/media/storage/{types,local,cloud,registry}.ts` +
  `tests/media-kind.test.mjs` · `app/api/media/upload/route.ts` + `app/api/media/[assetId]/raw/route.ts` ·
  `app/dashboard/media/{page,actions}.ts` · `components/media/MediaLibrary.tsx` (mounted in BOTH the
  top-level media page and the website media tab — one component, no duplication). *Files modified:*
  `prisma/schema.prisma` (+`MediaAsset`, `MediaFolder`, `MediaKind`, Workspace back-relations; migration
  `0005_media` applied) · `.gitignore` (+`.media-store/`). *Features:* upload/drag/bulk, folders, tags,
  alt text/metadata, search, usage count, storage health, image-editor operation catalog. **Local storage
  works** (fs → `.media-store/`, served via `/api/media/[id]/raw` with tenant-access); cloud providers
  (R2/S3/GCS/Azure/Supabase/Custom) credential-gated (awaiting Phase-10 keys). *Decisions:* media is
  workspace-scoped (reusable); serve route is access-checked; StorageProvider isolates persistence.
  *Tech debt:* image processing (crop/resize/webp/avif/bg-remove/AI-enhance) awaits an image pipeline
  (sharp/cloud) — UI + contract ready, marked awaiting-infra; responsive-image variants pending same.
  *Next:* Phase 8.3 AI Blog Generator.
- **Phase 8.1 — Domain Manager** — ✅ VERIFIED (2026-07-11): lint · type-check · test 94/94 (+5) ·
  build green; sitemap 66. *Objective:* connect/verify/manage custom domains, independent of
  deployment/content. *Files added:* `lib/domains/{dns,types,verify,providers,service}.ts` +
  `tests/domains-dns.test.mjs` · `app/dashboard/websites/[websiteId]/domains/{page,actions}.ts` (real UI) ·
  `components/domains/DomainManager.tsx`. *Files modified:* `prisma/schema.prisma` (+`Domain` model,
  `DomainStatus` enum, `Website.domains`; migration `0004_domain` applied). *Features:* connect domain,
  DNS records guidance, **real TXT verification via `node:dns` at request time**, SSL/certificate status,
  domain status/health, primary + multiple domains, WWW/redirect fields, subdomains, Cloudflare/Vercel/
  Netlify/Custom DNS providers (custom credential-free; cloud gated on the website's stored env keys —
  no duplicate credential store), provider health. *Decisions:* reuse `Website.deploymentConfig.envVars`
  for provider credentials (no new model); verification is real DNS lookup, cloud auto-attach/SSL pending
  Phase-10 keys. *Tech debt:* live cloud attach + cert issuance pending SDK/creds; propagation is checked
  on demand (no scheduled monitor until Phase 8.5). *Next:* Phase 8.2 Media Library.
- **Phase 8.0 — Deployment Engine** — ✅ VERIFIED (2026-07-11): lint · type-check · test 89/89 ·
  build green; sitemap 66. *Objective:* provider-abstracted publishing; Builder never deploys.
  *Files added:* `lib/deployment/{types,registry,service}.ts` + `lib/deployment/providers/{base,zip,cloud}.ts`
  (7 providers: zip + cloudflare/vercel/netlify/docker/github/custom, each implementing
  authenticate/validate/deploy/update/rollback/remove/verify/status/logs) ·
  `app/dashboard/websites/[websiteId]/deployments/{page,actions}.ts` (real dashboard) ·
  `app/api/websites/[websiteId]/export/route.ts` (ZIP-export download) ·
  `components/deployments/DeploymentDashboard.tsx`. *Files modified:* `prisma/schema.prisma`
  (+`Deployment` model, `DeploymentStatus` enum, `Website.deploymentConfig`; migration `0003_deployment`
  applied) · `.eslintrc.json` (ignore `^_` args). *Decisions:* deploys run synchronously in the service
  (durable queue → Phase 8.5); credentials come from `Website.deploymentConfig.envVars` (+ env), so cloud
  providers report "not configured" honestly without keys; ZIP export is functional (config bundle download).
  *Tech debt:* live cloud deploy/rollback/remove pending real SDK + Phase-10 credentials; full static-HTML
  zip pending AI-Generator output; no background queue yet. *Next:* Phase 8.1 Domain Manager.

- **Phase 7.2.5 — Visual Builder** — *Objective:* edit `Website.builderConfig` visually, reusing
  `BlockRenderer`/`ThemeProvider`/registry (no second format). *Files added:* `lib/builder/editor/*`
  (types/operations/history/document/block-meta/preview-context) + `components/builder/editor/*` (6) +
  `lib/websites/builder-service.ts` + `app/dashboard/websites/[websiteId]/builder/{page,actions}` +
  `tests/builder-{operations,history}.test.mjs`. *Decisions:* Option A (seed starter page via
  `composePage`; preview via sample business until per-website generation exists); draft/published/
  theme/globalStyles wrapped inside `builderConfig` JSON — no schema migration. *Status:* **✅ VERIFIED
  (2026-07-11): lint · type-check · test 89/89 (+13 builder) · build all green; sitemap 66 / JSON-LD 4
  unchanged; `/…/builder` route builds (18.3 kB).** Fixed on verify: `reorderBlocks` undefined-id guard;
  removed unused `withPage` import. *Tech debt:* builder page renders inside website-detail layout (double
  chrome); rich-text is textarea-level; per-website render/content bridge deferred to AI Generator.
  *Next:* Phase 8.0 Deployment (awaiting approval).

## 19 · Session Log (append-only; newest first)
> Template: `Date · Objective · Files Modified · Architecture Changes · Issues Found · Issues Fixed · Remaining Work · Next Task`

- **2026-07-18 (Template 2 shipped to Railway)** — *Objective:* commit + deploy the Template 2 milestone (see §18
  entry) after owner approval. *Shipped:* commit `0d0f397` on `develop` (22 files, +1700/−179) pushed → Railway
  auto-deployed (build+deploy ~2 min, service Online). *Production verified live:* template-2 CSS 200; published
  legacy site ("Lone Star Lawn Care", templateId 'base') renders Template 1 with the new OG/Twitter meta —
  no regression; test site "Mile High Roofing" switched to `template-2` → renders the new design (class="t2",
  sticky call bar, own h1) with owner session; per-site sitemap/robots 200. *Also this session:* reset the UAT
  account password (railway-verify-0717@example.com) via the app's own hashPassword against the public DB proxy —
  login + dashboard 200 verified before and after deploy. *Test data on production:* Mile High Roofing left on
  Template 2 intentionally as the owner's review artifact. *Remaining:* Lighthouse audit on a published Template 2
  site; template thumbnails in the picker. *Note:* no tags/merges — only `develop` was pushed, per approval scope.

- **2026-07-17 (Website Generator COMPLETE — Railway production-verified)** — *Objective:* resume from
  `feat: BYO AI keys…`, finish the generator, verify everything live on Railway. *Shipped:* (1) **in-process
  background worker** (`instrumentation.ts` self-fetches `/api/jobs/run` over loopback every 15s when
  `JOBS_WORKER_TOKEN` is set — jobs process with zero external cron; `WORKER_INLINE=0` opts out); (2) **export
  loopback fix** — self-fetch via the public https origin fails behind Railway's TLS proxy (OpenSSL "wrong
  version number") → fetch `http://127.0.0.1:$PORT` instead; canonical origin still stamped from domain/env.
  *Railway E2E (production, real UI via CDP browser):* register → login (redirect lands on Railway origin — the
  old localhost:8080 bug is env-fixed via AUTH_URL) → wizard created "Mile High Roofing" (Colorado dropdown,
  additional cities Aurora+Lakewood) → clicked Generate → **inline worker auto-processed it** (GENERATED,
  roofing industry) → all 9+ page types 200 with owner session, anon draft 404 (fail-closed) → **static ZIP
  export 200 on Railway** (21 pages, real zip, 0 sample leaks, form posts to the Railway /api/lead) → clicked
  Deploy → **QUEUED→READY processed automatically** by the inline worker. Gates green ×2 this session
  (151/151, sitemap 66). *Commits:* `bc1188b` (worker), `c4dd271` (export fix) — pushed, auto-deployed
  (deployments 77f3b625, b5bf13cc SUCCESS). *Railway env now complete:* AUTH_URL + SECRET_ENCRYPTION_KEY +
  JOBS_WORKER_TOKEN all set. *Remaining (non-generator):* email provider (verification copy), object storage,
  cloud-deploy providers, Redis, GA4/GSC — all external-creds-gated; code-only debt list unchanged (§ TODO.md).
  *Test data on production:* user railway-verify-0717@example.com + "Mile High Roofing" (DRAFT) left in place
  for the owner's manual testing. *Next task:* owner UAT on Railway; then Phase 10 provider wiring or code-only
  debt.
- **2026-07-16 (True AI Website Generator M1–M7 — resumed & completed)** — *Objective:* resume the interrupted
  generator build (M1–M3+M5 were on disk uncommitted; M4/M6/M7 unbuilt) and close the 2026-07-16 UAT criticals.
  *Outcome:* all six gates green (**142/142**, sitemap 66) + full live runtime E2E (prod server :3210): tenant
  sites serve all pages from their OWN config, custom-domain hosting works (Host-header rewrite → verified
  domain → tenant site with canonical=domain), static ZIP export is a real zero-JS multi-page site archive,
  draft sites fail closed 404. *Built this session:* M4 static export (`lib/export/{zip,favicon,static-blocks,
  static-site}` + real export route + form-encoded `/api/lead` + `?static=1` render variant + BlockRenderer
  overrides), M6 AI cache warming + offline banner, M7 image prompts + SVG favicon; fixes: tenant `title.absolute`
  (was inheriting "| Apex Plumbing Co."), marketing JSON-LD/brand-CSS moved to SiteChrome `seo` slot (was leaking
  onto tenant pages), SiteShell plain `<a>` links (next/link is a client reference — broke export SSR), `/hosted`
  passthrough in SiteChrome. *Issues found+fixed during E2E:* export 500 (client-function invocation → switched
  to self-fetch architecture); sample-business title/JSON-LD leaks. *Cleanup:* test user/site/domain deleted,
  wizard site restored to DRAFT, dev DB otherwise untouched. *Remaining:* Railway re-test with `AUTH_URL` set;
  TODO.md medium/low items (verification-email copy); tech debt in §18 entry. *Next task:* live Railway UAT
  re-run ("Empire Plumbing NYC") after env fix, then Phase 10 provider wiring. *Note:* no git writes — awaiting
  explicit approval.
- **2026-07-12 (Phase 11 — Deployment & UAT)** — *Objective:* production deploy prep + full UAT + Go/No-Go, no new
  features. *Outcome:* real staging sim (prod build on :3100 + fresh `leadgen_staging` DB); all six gates green
  (**136/136**, sitemap 66). *Issues found + fixed:* (1) missing security headers → added CSP/HSTS/Permissions-Policy
  (`next.config.mjs`); (2) `/api/media/[id]/raw` 500 on missing id → `readAssetBytes` now `findUnique`+null → 404.
  *UAT verified live:* auth (enum-safe, rate-limit 429, dashboard 307→login), auto-provision, tenant isolation, AI
  generate (12 blocks), blog, async deploy (READY), health probes, worker auth, **backup/restore (pg_dump→restore, rows
  matched)**, trash/restore, export 401, SEO (66/robots/4×JSON-LD/noindex), a11y (skip link/id=main/labels). *Deliverable:*
  `docs/PHASE_11_DEPLOYMENT_UAT.md` (diagram/env/rollback/monitoring/backup/Go-No-Go/launch checklist). *Verdict:* GO
  (conditional) — blocked only by external infra/creds. *Cleanup:* staging DB dropped, UAT data + temp files removed,
  dev DB untouched. *Remaining:* production cutover (needs YOUR Postgres + env + worker cron + TLS); deferred code-only
  debt. *Next task:* cutover on creds, or next code-only debt item. *Note:* no git commit — awaiting approval.
- **2026-07-12 (Release Engineering)** — *Objective:* RC-mode — refactor deployments onto the job queue, run a full
  production audit, apply all code-only fixes. *Outcome:* all six gates green (**136/136**, sitemap 66), async deploy
  verified E2E twice (QUEUED→READY via the worker). *Async deploy:* `lib/deployment/service.ts` (removed `runDeploy`;
  added `runDeployCore`/`runDeployForWebsiteCore`/`buildDeploymentInput`; enqueue instead of inline), `lib/jobs/handlers.ts`
  (`deployment.run` now real, dual payload). *Audit:* 6 parallel specialist reviewers (arch/scale, security, db/perf,
  api, ux/a11y/seo, code-quality). *Fixes applied + gate-verified:* admin-gate AI diag routes; `SECRET_ENCRYPTION_KEY`
  fail-closed in prod; stuck-job reaper (`reapStuckJobs`+`isStuck`) + `maxDuration`; migration `0010_job_website_index`
  (indexed `Job.websiteId`, replaces JSON-path scan; +reaper index); removed dead `framer-motion`; `jobs/actions.ts`
  guard; modal focus-trap/restore; skip links; LeadForm a11y; assertive error toasts; wizard `aria-current`; dark-mode
  error colors; data-table `overflow-x-auto`. *Tests:* +6 (secrets prod behavior ×2, isStuck ×1 counted in suite; env,
  secrets, jobs-policy suites). *Remaining (code-only, deferred, documented):* `SKIP LOCKED` claim, intra-tick
  concurrency, `createMany` bulk enqueue, `toJson<T>()` + Zod-on-read for JSON blobs, dedupe credential/revision helpers,
  job ownership-scoping, integration/E2E harness. *External blockers (unchanged):* provider keys, object storage, Redis,
  GA4/GSC OAuth, a running cron worker. *Next task:* Phase 10 provider wiring + the deferred code-only debt.
- **2026-07-12** — *Objective:* resume the project, clear the SESSION_HANDOFF §0 blocking gate issue, verify the
  ungated AI Generator + infra batch, begin production hardening toward a Release Candidate. *Outcome:* **ALL SIX
  GATES GREEN, self-run** (Bash is available this session — no classifier outage): prisma generate · migrate deploy
  (0008+0009 applied) · type-check · lint · test **124/124** · build (sitemap 66). *Issues found + fixed:* (1) the
  `teamInvitation` type-check blocker = **stale generated Prisma client** → `prisma generate` fixed it; (2)
  `business-adapter` emitted empty `address.street` failing schema `min(1)` → set to `` `${city} Service Area` ``.
  *Cleanup:* removed orphaned dead `components/auth/AcceptInvitationForm.tsx`; kept Team redirect/410 stubs.
  *Architecture:* unchanged — no redesign, no Team reintroduced, tenant-access layer intact. *Also shipped + verified
  this session (same green tree):* **secret encryption at rest** (`lib/security/secrets.ts`, AES-256-GCM) wired into
  deployment + domain provider credentials; +6 tests (**133/133**); runtime-verified the generation pipeline (12-block
  home page). *Remaining:* async deployments onto the queue (code-only), then Phase 10 provider wiring (external creds
  gate the live cloud/AI/analytics integrations). *Next task:* async deployments → Phase 10.
- **2026-07-11 (later)** — *Objective:* verify Phase 9, remove Team Collaboration, enter Production Stabilization.
  *Outcome:* **ALL SIX GATES GREEN** (user-run: prisma generate · migrate deploy 0008+0009 · type-check · lint ·
  test 119/119 · production build). *Issues found + fixed:* stale Prisma client; wrong import module for
  `restoreFromTrash`/`purgeWebsite`; `'article'`→`'ARTICLE'`; hooks-rule rename `markPromptUsed`; two invitation
  files querying removed `prisma.teamInvitation` → stubbed (redirect + 410); **build-fails-but-type-check-passes
  root cause = stale root `tsconfig.tsbuildinfo` incremental cache (survives `rm -rf .next`)** → cleared.
  *Architecture:* Team models removed (migration 0009); Organization/Workspace/Membership/access layer UNCHANGED;
  single-org/workspace switchers hidden. *Also:* ran an independent architecture audit (see §18 tech-debt + §21).
  *Remaining:* Production Stabilization Phase A criticals (AI Generator wiring, object storage, async deploys,
  distributed rate-limit/event-bus) → Phase 10. *Next task:* Production Stabilization / Phase A. *Note:* many gate
  runs this session were blocked by Claude Code safety-classifier outages; user executed gates locally and pasted
  output — no results fabricated; nothing marked complete without observed green output.
- **2026-07-11** — *Objective:* implement + verify Phase 8.5 Background Infrastructure. *Files:* added
  `lib/jobs/*` (7 modules), `app/api/jobs/run/route.ts`, `app/dashboard/{jobs,notifications}/*`,
  `components/jobs/*`, `tests/jobs-policy.test.mjs`; modified `prisma/schema.prisma` (migration `0007_jobs`
  applied), `lib/dashboard/nav.ts` (+Jobs/Notifications, −Team). *Architecture:* durable DB-backed queue +
  token-gated worker entrypoint (external scheduler); event bus; notification center; jobs run as SYSTEM.
  *Issues found:* `serverError` 1-arg call (TS2554); Prisma `Json` write typing. *Issues fixed:* both — plus
  moved `nextOccurrence` into pure `policy.ts` so the Node test loader resolves it. **All four gates green
  (test 114/114).** *Remaining:* Phase 9 → 10 → 10.5 → 10.6 → RC → v1.0; git-publish v0.8.0-alpha (deferred).
  *Next task:* Phase 9 Single-User Productivity. *Note:* several gate runs were interrupted by intermittent
  Claude Code safety-classifier outages; gates were re-run to completion — no results fabricated.
- **2026-07-11** — *Objective:* verify Phase 7.2.5 gates + finish memory consolidation. *Files:* fixed
  `lib/builder/editor/operations.ts` + `components/builder/editor/BuilderEditor.tsx`; added
  `.claude/{token-guide.md,context.json}`; `CLAUDE.md` PROJECT MEMORY banner; supplement banners on
  `.claude/{progress,tasks,project,roadmap,change-history}.md`; added §16–§20 (Definition of Done, Release/
  Milestone/Session logs, ADR) to this file. *Issues fixed:* Builder type error + unused import; **all four
  gates green (test 89/89).** *Remaining:* git-publish v0.8.0-alpha; Phases 8.0–8.4. *Next task:* Phase 8.0 Deployment.
- **2026-07-10** — *Objective:* Visual Builder implementation + memory consolidation. *Files:* builder editor
  stack; `.claude/resume.md`; `PROJECT_MEMORY.md`. *Issues found:* persistent Bash classifier outage blocked
  gates all day. *Remaining:* verify (done 07-11).

## 20 · Architecture Decision Log (ADR)
> Each: `Decision · Reason · Alternatives · Impact · Future implications`. Append-only.

- **Auth.js v5** — *Reason:* App-Router-native (`auth()`), JWT, avoids v4→v5 migration; scrypt (node:crypto)
  avoids a native dep. *Alternatives:* NextAuth v4; bcrypt/argon2. *Impact:* Credentials → JWT strategy.
  *Future:* OAuth/DB-sessions attach later.
- **Org → Workspace → Project → Website hierarchy** — *Reason:* multi-tenant SaaS with a clear aggregate.
  *Alternatives:* single-account (the reference product). *Impact:* every resource is tenant-scoped.
  *Future:* hide switchers for single-workspace users.
- **Central tenant-access layer (`lib/auth/access`)** — *Reason:* one authorization vocabulary; cross-tenant
  reads return NOT_FOUND (fail-closed). *Alternatives:* ad-hoc `where` per query (leak-prone). *Impact:*
  all reads/writes route through `require*Access`. *Future:* every new module registers a resolver.
- **Deployment Provider abstraction** — *Reason:* pluggable hosts; Builder must never know deployment.
  *Alternatives:* hard-coded host logic. *Impact:* providers implement a common interface. *Future:* Phase 8.
- **Website Workspace before Visual Builder** — *Reason:* users manage a website (a full OS of modules)
  before editing; Builder is one tab. *Alternatives:* jump straight into the editor. *Impact:* detail shell
  with tabs. *Future:* every module mounts as a workspace tab.
- **Builder independent of deployment** — *Reason:* single responsibility; edits `builderConfig` only.
  *Alternatives:* builder-triggers-deploy coupling. *Impact:* separate services communicate via shared
  services. *Future:* deployment reads published config, never the reverse.
- **Single-source-of-truth memory (`PROJECT_MEMORY.md`)** — *Reason:* minimize onboarding tokens; one
  authoritative file. *Alternatives:* many overlapping `.claude/*` docs. *Impact:* others become pointers.
  *Future:* update this file at every milestone (see §16).
