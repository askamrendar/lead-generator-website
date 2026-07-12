# PROJECT_MEMORY.md — Single Source of Truth

> **Read this file first, and usually only this file.** It is the canonical memory for
> the project. Everything else in `.claude/` and the root docs is a supporting reference.
> Update this file whenever a milestone finishes. Last updated: 2026-07-10.

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
