# SESSION HANDOFF — Lead Generator Website SaaS

> **Read this first, then `PROJECT_MEMORY.md`.** This file is a zero-context resume doc
> written at the end of a long session. `PROJECT_MEMORY.md` holds the canonical
> append-only history (§17 Release Log, §18 Milestone Log, §19 Session Log, §20 ADR) —
> do NOT overwrite it; append only.
>
> **Last updated:** 2026-07-11. **Author:** Claude (session handoff).

---

## 0. ⚠️ READ THIS BEFORE DOING ANYTHING

There is an **UNRESOLVED, BLOCKING gate issue** and a batch of **UNVERIFIED code**.
Do not claim anything is "done" or "production-ready" until the six quality gates run
green on the current tree. See §5 and §9. The previous session could not run the gates
itself (Claude Code Bash was blocked by the safety classifier the entire session); the
user ran them locally and pasted output.

**The single most important next action:** get `npm run type-check` to pass, then run
the remaining five gates. Everything else is downstream of that.

---

## 1. Project Overview

- **Product:** "Lead Generator Website" (concept name "Local Sites Pro"). An AI SaaS that
  turns one business-info form into a complete, SEO-optimized, nationwide local-business
  website, then lets the user generate → edit (visual builder) → deploy → connect a domain.
- **Target user:** local service businesses (plumbing, HVAC, roofing, electrical, etc.)
  and the agencies who build for them.
- **Business model:** subscriptions + AI-usage credits. **Billing is NOT implemented (by
  policy — see §25).**
- **Product direction (LOCKED):** **single user per account.** No teams, invitations,
  roles-for-collaboration, audit logs, or shared workspaces — ever. (Organization/
  Workspace/Membership are KEPT as the tenant spine; see §18.)

---

## 2. Overall Architecture

**Two layers:**
1. **Generation engine** (mature, stable since v0.6.0): AI content, Website Builder,
   themes, industries, templates, SEO — config-driven, offline-safe, zero circular deps.
2. **SaaS layer** (Phase 7+): Auth.js v5, Prisma/Postgres multi-tenancy, dashboard,
   Website Manager/Workspace, Deployment/Domains/Media/Analytics/Jobs/Productivity.

**Ownership hierarchy:** `Organization → Workspace → Project → Website`.
Every account auto-gets exactly ONE Organization + ONE Default Workspace + an OWNER
Membership via `lib/auth/provisioning.ts` (`provisionNewUser`), idempotently, on both
Credentials and OAuth signup.

**The central rule:** every tenant resource is read/written ONLY through the tenant-access
layer `lib/auth/access` (`require*Access(id, permission)` → scoped `AccessContext`).
Cross-tenant access resolves to `NOT_FOUND` (fail-closed, non-probeable). Never hand-roll
tenant `where` clauses; use the `*Scope` helpers.

**Module ownership (each owns ONE responsibility, communicates via services):**
- Auth — `lib/auth/*`
- Tenant access / RBAC — `lib/auth/access`, `lib/auth/permissions`
- Website Manager — `lib/websites/service.ts` (the ONLY website read/write path)
- Visual Builder — `lib/builder/*` + `lib/builder/editor/*`; edits `builderConfig` only
- AI engine — `lib/ai/*`; Content/Blog — `lib/blog/*`
- Deployment — `lib/deployment/*`; Domains — `lib/domains/*`; Media — `lib/media/*`
- Analytics — `lib/analytics/*`; Background Jobs — `lib/jobs/*`
- Productivity — `lib/productivity/*`; Prompts — `lib/prompts/*`; Preferences — `lib/preferences/*`
- AI Generator (NEW this session) — `lib/websites/generate-service.ts` +
  `lib/websites/business-adapter.ts` (orchestrates the above; NO new generation logic)

---

## 3. Folder Structure

```
app/
  (auth)/            login, register, reset, verify, invitations (STUB→redirect)
  dashboard/         shell + all dashboard pages
    websites/[websiteId]/  per-website tabs: overview, builder, ai-generator, pages,
                           seo, deployments, domains, media, analytics, versions, settings
    favorites/ trash/ prompts/ preferences/ tasks/ jobs/ notifications/ analytics/ media/
  api/
    auth/            register, accept-invitation (STUB→410)
    jobs/run/        background worker entrypoint (token-gated)
    media/           upload + raw serve
    health/          live, ready, metrics (NEW this session)
    websites/        export (ZIP)
  services/ locations/ ...  marketing + generated SSG/ISR pages
components/  ui/ dashboard/ websites/ builder/ blocks/ media/ blog/ deployments/
            domains/ analytics/ jobs/ productivity/ auth/ seo/ theme/
lib/        auth/ (+access, +permissions) db/ websites/ builder/ ai/ blog/ deployment/
            domains/ media/ analytics/ jobs/ productivity/ prompts/ preferences/
            dashboard/ search/ generator/ seo/ api/ env.ts logger.ts site.ts utils.ts
themes/ (8)  industries/ (5)  templates/ (4)   ← additive builder assets
prisma/     schema.prisma + migrations/0001..0009
tests/      node --test pure-logic suites (*.test.mjs)
docs/       DEPLOYMENT.md, DEPLOYMENT_PRODUCTION.md (NEW), SECURITY.md, etc.
.github/workflows/  production-gates.yml (NEW), release.yml (NEW)
Dockerfile, docker-compose.yml (dev DB), docker-compose.prod.yml (NEW)
```

---

## 4. Technologies

- **Next.js 15** (App Router, RSC, server actions), **React 19**, **TypeScript strict**
- **Tailwind 3** (CSS-variable design tokens, `.dark` variant), **Zod**
- **Auth.js v5** (`next-auth@5.0.0-beta.31`) + `@auth/prisma-adapter`, JWT sessions,
  Credentials + optional Google/GitHub, **scrypt** password hashing (`node:crypto`)
- **Prisma 6.19.3** + **PostgreSQL 16**
- **Node 22**; tests via `node --test --experimental-strip-types` (zero test deps)
- No Redis/S3/queue-broker yet (all are single-instance/in-memory today — see §7/§9)

---

## 5. Current Implementation Status

| State | Meaning |
|---|---|
| ✅ VERIFIED | Gate-green in a prior phase |
| 🟡 UNVERIFIED | Written this session; **has NOT passed any gate** |
| ⚠️ PARTIAL | Works by design but incomplete (cloud gated / no worker / etc.) |
| ❌ | Placeholder / not implemented |

**✅ VERIFIED (gate-green in prior phases 7.2.5–9):** Auth, RBAC/tenant-access,
Org/Workspace/Membership, Website Manager, Visual Builder, Deployment Engine (ZIP + gated
cloud), Domain Manager (DNS-only), Media Library (local-fs), AI Blog Generator
(deterministic), Analytics (internal metrics), Background Infrastructure (queue, no
worker), Single-User Productivity (Phase 9 — last gate-green state: **119/119 tests, all
six gates green** per user output).

**🟡 UNVERIFIED (written this session, NOT gated):**
- **AI Generator** (Task 1): `lib/websites/generate-service.ts`,
  `lib/websites/business-adapter.ts`, `jobsForWebsite` in `lib/jobs/service.ts`,
  `website.generate` handler wiring, `components/websites/AiGenerator.tsx`,
  `app/dashboard/websites/[websiteId]/ai-generator/{page,actions}.ts`,
  `saveBuilderDocumentCore` in `lib/websites/builder-service.ts`,
  `tests/business-adapter.test.mjs`.
- **Env validation** (`lib/env.ts`), **Logger** (`lib/logger.ts`),
  **Health endpoints** (`app/api/health/{live,ready,metrics}/route.ts`).
- **Config/docs (no TS, cannot affect gates):** `Dockerfile`,
  `docker-compose.prod.yml`, `.github/workflows/{production-gates,release}.yml`,
  `docs/DEPLOYMENT_PRODUCTION.md`, `.env.example` additions.

---

## 6. Completed Features (verified)
Marketing site (sitemap 66 URLs, JSON-LD, ISR service×city matrix) · full auth flow ·
multi-tenancy + RBAC + tenant-access · dashboard shell + ⌘K palette + dark mode ·
Website CRUD/wizard/trash/archive/favorites/pin/versions · Visual Builder (blocks,
inline edit, undo/redo, autosave, theme, device preview) · deterministic Blog generator ·
internal Analytics (tiles, trend chart, CSV, health score) · durable Job queue +
notification center · Prompt Library + AI history · Preferences (theme/shortcuts).

---

## 7. Features Remaining (real work, not done)
- **AI Generator:** verify gates; add wizard steps (Template→Theme pickers), Prompt
  Library hook, resume-generation. (Core orchestration is written but ungated.)
- **Production media storage:** R2/S3 providers (interface exists; SDK not integrated).
- **Async deployments:** move `runDeploy` (currently synchronous) onto the job queue.
- **Real worker runtime:** cron → `/api/jobs/run` (docker-compose.prod.yml has a curl loop).
- **Secret encryption at rest:** provider creds in `deploymentConfig.envVars` are plaintext.
- **Distributed rate limiter + event bus** (Redis) — currently in-memory/per-instance.
- **Provider SDKs:** OpenAI/Anthropic/Gemini live calls, cloud deploy, GA4/GSC — abstractions
  are honest "awaiting credentials" stubs.
- **Integration/E2E tests** — currently 100% pure-unit; zero integration/E2E.
- **Billing** — not started (by policy).

---

## 8. Known Bugs
- **[BLOCKING] `type-check` reports `Property 'teamInvitation' does not exist` at
  `app/(auth)/invitations/[token]/page.tsx:24`** — but that file on disk is a clean
  10-line redirect stub with NO `teamInvitation`. Root cause NOT yet verified (see §9).
- **[HIGH]** AI Generator batch is unverified — may contain type errors (Prisma JSON
  filter typing in `jobsForWebsite`, `BusinessConfigInput` conformance in the adapter).
- **[MED]** Postgres enum footgun: migration `0008` does `ALTER TYPE "WebsiteStatus" ADD
  VALUE 'TRASHED'`. It only *adds* (doesn't *use*) the value, so it applied per user
  output — but if a future migration adds+uses an enum value in one file, split it.

---

## 9. Root Cause Analysis of Current Issue (UNRESOLVED — do not assume)

**Symptom:** `npm run type-check` fails with `teamInvitation` on line 24 of a clean
10-line file. That property was removed with the Team models (migration `0009_remove_team`);
the regenerated Prisma client has no `teamInvitation`.

**What is PROVEN:**
- The source file `app/(auth)/invitations/[token]/page.tsx` is a clean redirect stub —
  no `prisma`, no `teamInvitation` (read multiple times).
- Therefore the error CANNOT originate from that file's real contents.

**What is NOT yet proven (candidate causes — a forensic search was requested but its
output never reached the previous session):**
1. Remaining Team refs in some OTHER source file
2. Duplicate route/file (e.g. `src/` copy, differently-cased path, stray `.js`)
3. Next.js build cache (`.next/`) / generated route types (`.next/types/**`)
4. Incremental TS cache (`tsconfig.tsbuildinfo` — `"incremental": true` in tsconfig;
   survives `rm -rf .next`). **This is the leading hypothesis but is UNCONFIRMED.**
5. Build configuration
6. Generated artifacts
7. Something else

**DO THIS to identify the verified root cause (run and read each):**
```bash
# 1) Any Team ref in real source (should be EMPTY):
grep -rn "teamInvitation\|teamMembership" --include=*.ts --include=*.tsx . \
  | grep -v node_modules | grep -v "/.next/"
# 2) Every invitations path on disk (expect exactly the one page dir):
find . -ipath "*invitation*" -not -path "*/node_modules/*" -not -path "*/.next/*"
# 3) What git tracks:
git ls-files | grep -i invitation
# 4) The FULL error line (does the path point into .next/types?):
npm run type-check 2>&1 | grep -B2 -A2 teamInvitation
# 5) Caches present:
ls -la tsconfig.tsbuildinfo .next 2>/dev/null
```
**Decision rule:**
- If (1) returns a real source line → that's a genuine stray ref; fix that file.
- If (2)/(3) show a duplicate invitations file → delete the duplicate.
- If (4)'s error path is `.next/types/**` → stale Next build cache; `rm -rf .next`.
- If (1)(2)(3) are clean AND `tsconfig.tsbuildinfo` exists AND the error path is the real
  source file → stale incremental cache; `rm -f tsconfig.tsbuildinfo && rm -rf .next`.
- **Only then** apply the matching minimal fix. Do NOT delete caches on speculation.

**Optional durable fix (if confirmed to be the incremental cache):** change the
`type-check` script in `package.json` to `tsc --noEmit --incremental false` so the gate
always reads real source. (This edit was proposed but NOT applied — user paused it pending
root-cause evidence.)

**Also pending cleanup regardless of root cause:** delete the fully-obsolete Team files
(they are redirect/410 stubs now):
```bash
rm -rf "app/(auth)/invitations" "app/api/auth/accept-invitation" "app/dashboard/team"
rm -f "components/auth/AcceptInvitationForm.tsx"
```

---

## 10. Files Modified/Added This Session

**Added:** `lib/env.ts`, `lib/logger.ts`, `lib/websites/generate-service.ts`,
`lib/websites/business-adapter.ts`, `app/api/health/{live,ready,metrics}/route.ts`,
`app/dashboard/websites/[websiteId]/ai-generator/actions.ts`,
`components/websites/AiGenerator.tsx`, `tests/business-adapter.test.mjs`,
`Dockerfile`, `docker-compose.prod.yml`,
`.github/workflows/{production-gates,release}.yml`, `docs/DEPLOYMENT_PRODUCTION.md`,
`prisma/migrations/0008_productivity/`, `prisma/migrations/0009_remove_team/`.

**Modified:** `prisma/schema.prisma` (Phase 9 models + Team removal),
`lib/jobs/service.ts` (+`jobsForWebsite`), `lib/jobs/handlers.ts` (real `website.generate`,
`blog.generate`), `lib/websites/{service,types,status,nav,builder-service}.ts`,
`lib/dashboard/nav.ts`, `lib/search/registry.ts`,
`components/dashboard/{NotificationsButton,OrganizationSwitcher,WorkspaceSwitcher}.tsx`,
`components/websites/WebsiteActions.tsx`,
`app/dashboard/websites/[websiteId]/ai-generator/page.tsx` (placeholder→real),
`app/(auth)/invitations/[token]/page.tsx` + `app/api/auth/accept-invitation/route.ts`
(→ stubs), `.env.example`, `PROJECT_MEMORY.md` (§14/§18/§19 appended for Phase 9).

---

## 11. Important Design Decisions
- **AI Generator reuses, never duplicates:** wizard `businessConfig` →
  `wizardToBusinessConfig` (adapter) → `parseBusinessConfig` → `aiSelectBuild`
  (AI-or-heuristic) → `composePage` → `normalizeDocument` → `saveBuilderDocumentCore`
  → `Website.status = GENERATED`. No parallel generation flow.
- **System-vs-session split:** job handlers run as SYSTEM (no session). Services expose a
  `*Core` variant (e.g. `generateWebsiteCore`, `generateOneCore`, `saveBuilderDocumentCore`)
  used by both the session-guarded entry AND the queue — single implementation, one writer.
- **Team removed but tenant spine KEPT:** Org/Workspace/Membership stay (removing them =
  full access-layer rewrite). Switchers hidden when count ≤ 1.
- **Honest gating:** external integrations show "Awaiting Credentials" — never fabricated.
- **`lib/env.ts` never throws at import** (protects the offline-first build); production
  requirements enforced explicitly via `validateEnv()`/`assertEnv()`.

---

## 12. Coding Conventions
- Reuse-first, composition over duplication, SOLID (esp. SRP + Open/Closed via registries).
- Strict TS, `@/*` alias. **Pure modules used by tests use RELATIVE `.ts` value imports**
  (the Node test loader can't resolve `@/` or extensionless for value imports);
  `allowImportingTsExtensions: true` in tsconfig.
- Tests: `node --test` pure-logic only, `tests/*.test.mjs`.
- Builder edits pages only; never deploys. Deployment never edits content.
- Never bypass `lib/auth/access`. `Website` is the central aggregate.
- Prisma `Json` writes cast as `... as unknown as object` (existing convention).
- After EVERY module: run all six gates, fix everything, append `PROJECT_MEMORY.md`.
- Never commit/push/tag without explicit user approval.

---

## 13. Environment Variables (see `.env.example`)
**Production-required** (`lib/env.ts` `validateEnv()`): `DATABASE_URL`, `DIRECT_URL`,
`AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
**Important optional:** `AUTH_TRUST_HOST`, `JOBS_WORKER_TOKEN` (enables `/api/jobs/run`),
`ADMIN_API_TOKEN` (fail-closed admin/metrics), `SECRET_ENCRYPTION_KEY` (future secret
encryption), `LOG_LEVEL`, `ALLOW_LOCALHOST_BUILD=1` (demo/CI build), AI keys
(`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`/`OPENROUTER_API_KEY`),
media `R2_*`/`S3_*` (future).
Local DB URL used this session: `postgresql://<whoami>@localhost:5432/leadgen?schema=public`
(Homebrew postgres) — CI/docker use `postgres:postgres@…`.

---

## 14. Commands to Run Locally
```bash
# DB (choose one)
npm run db:up                 # docker Postgres (postgres:postgres)
# or Homebrew postgres already running as your user

export DATABASE_URL="postgresql://$(whoami)@localhost:5432/leadgen?schema=public"
export DIRECT_URL="$DATABASE_URL"

# THE SIX QUALITY GATES (must all pass before claiming done):
npx prisma generate
npx prisma migrate deploy
npm run type-check
npm run lint
npm test
ALLOW_LOCALHOST_BUILD=1 npm run build

npm run dev                   # local dev server
```

---

## 15. Production Deployment Plan
See `docs/DEPLOYMENT_PRODUCTION.md`. Summary: single long-lived Node instance + managed
Postgres + an external cron hitting `/api/jobs/run`. Docker path:
`docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`
(app + Postgres + worker-cron). Health probes: `/api/health/{live,ready,metrics}`.
Release via tag → `.github/workflows/release.yml` (re-runs gates, builds image, draft
GitHub release). **Never auto-deploy to production; wait for explicit approval.**

---

## 16. TODO Checklist (P0→P2)
**P0 (before ANY deploy):**
- [ ] Get all six gates green on the current tree (fix the §9 `teamInvitation` issue first)
- [ ] Verify the AI Generator batch compiles + works end-to-end
- [ ] Stand up a running worker (cron → `/api/jobs/run`)
- [ ] Object storage (R2/S3) for media
- [ ] One cloud-deploy provider working end-to-end
- [ ] Secret encryption at rest before storing real customer creds

**P1 (before public beta):**
- [ ] Distributed rate limiter (Redis), esp. auth endpoints
- [ ] Integration + E2E tests; CI enforcing all six gates
- [ ] Move deployments onto the queue (async)
- [ ] Delete obsolete Team files (§9)

**P2:** data caching tier · JSON-blob offloading · `prisma migrate diff` CI guard ·
upload AV/content-type validation.

---

## 17. Next Immediate Task
**Resolve §9 (verified root cause → minimal fix) so `npm run type-check` passes**, then
run the remaining five gates one at a time, fixing only reported errors. Once all six are
green: append `PROJECT_MEMORY.md` (§18 Milestone + §19 Session, append-only) marking the
AI Generator + infra batch verified. Then continue P0. **Do NOT start new phases or update
memory until gates are green.**

---

## 18. Things That Should NEVER Be Changed
- **Do NOT reintroduce Team collaboration** (permanently removed; single-user only).
- **Do NOT remove Organization, Workspace, Membership, or the `lib/auth/access` layer.**
- **Do NOT bypass `require*Access`** or hand-roll tenant `where` clauses.
- **Do NOT duplicate** the AI/builder/content/deployment/media generation logic — reuse
  the existing services/`*Core` functions.
- **Do NOT make the Builder deploy** or the Deployment engine edit content.
- **Do NOT overwrite `PROJECT_MEMORY.md`** — append only; never rewrite history.
- **Do NOT commit/push/tag or claim gates passed without real output.**
- Preserve SEO invariants: sitemap 66 URLs, home JSON-LD = 4 blocks, marketing home static.

---

## 19. Performance Optimizations Completed
RSC-first; ISR on the service×city matrix (`revalidate = 86400`) for thousands of pages;
dependency-free SVG charts (no chart lib); tight Prisma `select` projections; parallel
aggregate queries in analytics; single shared `PrismaClient` (global cache in dev).
**Not done:** data-caching tier (every dashboard load hits Postgres); global AI-concurrency
coordination; async deploys.

---

## 20. SEO Strategy
Deterministic generation engine emits a nationwide local footprint: home/about/contact,
`/services/[slug]`, `/services/[slug]/[state]/[city]`, `/locations/[state]/[city]`,
ZIP/neighborhood pages. Internal-link engine, expanded JSON-LD (LocalBusiness subtype per
industry), sitemap (66 URLs) + robots. Single origin source of truth: `NEXT_PUBLIC_SITE_URL`
→ `lib/site.ts` (build guard warns/fails on localhost in prod). Every canonical URL, OG
tag, sitemap entry, JSON-LD `@id` derives from that one env var.

---

## 21. AI Generation Flow (NEW — Task 1; UNVERIFIED)
```
Website.businessConfig (wizard shape)
  └─ wizardToBusinessConfig()          lib/websites/business-adapter.ts  (pure adapter)
  └─ parseBusinessConfig()             lib/generator/schema.ts           (validate + defaults)
  └─ aiSelectBuild(business)           lib/builder/select.ts   (AI picks template/theme/industry,
                                                                deterministic fallback)
  └─ composePage(template,'home',…)    lib/builder/compose.ts  (PageDefinition of blocks)
  └─ normalizeDocument(...)            lib/builder/editor/document.ts (→ BuilderDocument)
  └─ saveBuilderDocumentCore()         lib/websites/builder-service.ts (ONLY builderConfig writer)
  └─ Website.status = GENERATED
```
Runs ASYNC via the Phase 8.5 queue: dashboard action `startGenerationAction` → `enqueue`
`website.generate` job → handler calls `generateWebsiteCore`. UI polls job status; history
via `jobsForWebsite`; retry/cancel reuse existing job actions; runs recorded via `recordAiRun`.
**Content copy** is synthesized by the builder blocks' existing content engine at render
time; the Blog generator covers article/page content separately.

---

## 22. Database Schema (Prisma / Postgres)
**Auth (Auth.js contract):** User, Account, Session, VerificationToken, PasswordResetToken.
**Tenancy:** Organization, Membership (Role: OWNER/ADMIN/MEMBER/VIEWER), Workspace,
WorkspaceSettings, Project, Website. **REMOVED:** Team, TeamMembership, TeamInvitation,
InvitationStatus enum (migration 0009).
**Website** (central aggregate): businessConfig/builderConfig/seoConfig (Json), themeId/
templateId/industryId, status (WebsiteStatus: DRAFT/GENERATED/PUBLISHED/ARCHIVED/TRASHED),
archivedAt/trashedAt/pinnedAt/favorite/lastOpenedAt/revisions(Json), deploymentConfig(Json),
relations: deployments, domains, content.
**Modules:** Deployment(+DeploymentStatus), Domain(+DomainStatus), MediaAsset/MediaFolder
(+MediaKind), ContentItem(+ContentType/ContentStatus), Job(+JobStatus),
Notification(+NotificationLevel), UserPreference, Prompt, AiRun.
Migrations: 0001 auth/tenancy … 0007 jobs, 0008 productivity, 0009 remove_team.
**Debt:** heavy Json columns (unqueryable, unbounded); loose refs w/o FK
(`AiRun.websiteId`, `featuredImageId`).

---

## 23. API Routes
- `POST /api/auth/register` — enumeration-safe signup + `provisionNewUser`
- `POST /api/auth/accept-invitation` — **410 stub** (Team removed)
- `GET/POST /api/jobs/run` — worker entrypoint, token-gated (`JOBS_WORKER_TOKEN`), fail-closed
- `POST /api/media/upload`, `GET /api/media/[assetId]/raw` — access-checked
- `GET /api/websites/[websiteId]/export` — ZIP export
- `GET /api/health/live|ready|metrics` — NEW; metrics is `ADMIN_API_TOKEN`-gated
- AI admin routes under `/api/ai/*` (admin-token gated) from the generation engine
Most mutations are **server actions**, not REST routes. All go through `require*Access`
+ Zod. `serverError(context, err)` gives a uniform 500 (no stack leak). Rate limiting via
`lib/api/{security,rate-limit}` (in-memory, per-instance).

---

## 24. Authentication Flow
Auth.js v5, JWT strategy (lean token = user id; roles resolved at use via `lib/auth/session`).
Credentials (scrypt via `node:crypto`) + optional Google/GitHub (enabled only if both
id+secret present). Register → hash → create User → `provisionNewUser` (Org+Workspace+OWNER)
→ email-verification token (hashed, single-use). Middleware (`middleware.ts` + Edge-safe
`lib/auth/middleware.ts`) guards `/dashboard` and `/app` only; matcher is an inline literal.
`AUTH_TRUST_HOST=true` required behind non-Vercel proxies.

---

## 25. Billing Flow
**NOT IMPLEMENTED — deferred by explicit policy.** No Stripe, no plans, no metering, no
credits enforcement. The business model (subscriptions + AI-usage credits) is documented
only. Do not implement billing unless the user explicitly asks. When added, it attaches at
the Organization level (the tenant/billing boundary).

---

## 26. Prompt Architecture
Two layers:
1. **Engine prompts** (`lib/ai/*`): versioned, provider-agnostic (openai/anthropic/gemini/
   openrouter/mock), file+memory cache, deterministic offline fallback. `getAIConfig()` +
   `getProvider()`; `provider.complete({prompt, json, temperature, maxTokens, model})`.
   Per-process concurrency limiter (`lib/ai/services/rate-limit.ts`, default 4).
2. **User Prompt Library** (Phase 9, `lib/prompts/service.ts`): user-scoped `Prompt` records
   (title/body/category/favorite/builtIn/useCount) + starter seeds + `AiRun` history.
   `markPromptUsed` (NOT `usePrompt` — that name tripped react-hooks lint). Not yet wired
   INTO the AI Generator (a P1 todo).

---

## 27. Industry / Template Architecture
Additive registries — add a file, no code change:
- `industries/` (5 packs): category, schema.org type, terminology, services, FAQs,
  imageKeywords, promptHints, `defaultThemeId`, `defaultTemplateId`.
- `templates/` (4 + base): `layouts: Partial<Record<PageType, BlockInstance[]>>`; `home`
  required, others fall back to `baseTemplate`.
- `themes/` (8): design-token sets (HSL triplets).
- Selection: `matchIndustryByCategory` → industry's default template/theme; `selectBuild`
  (deterministic) / `aiSelectBuild` (AI picks from registries, heuristic fallback).
- Blueprint library for the wizard: `lib/productivity/templates.ts` (6 starter blueprints
  that pre-fill the create wizard via `?blueprint=`).

---

## 28. Content Generation Pipeline
- **Site content:** `composePage` builds a `PageDefinition` (ordered `BlockInstance[]`);
  blocks synthesize copy from `BlockContext` (business + resolved services/cities + AI or
  deterministic content) at render time via `BlockRenderer`. Single page format stored in
  `Website.builderConfig` (wrapped as `BuilderDocument`).
- **Blog/content:** `lib/blog/service.ts` — `generateOne`/`generateOneCore` produce
  `ContentItem`s (14 content types), deterministic baseline, SEO helpers (title/desc/
  word-count/reading-time/excerpt), draft/publish/schedule/archive, revisions (capped 20),
  bulk generation via the queue (`blog.generate`). Live AI copy activates when a key is set.

---

## 29. Anything Else the Next Instance Needs to Know
- **The whole session ran under a Claude Code Bash classifier outage** — the assistant
  could NOT run gates/migrations. The USER ran them locally and pasted output. Expect the
  same; ask the user to run one gate at a time and paste output. Never fabricate results.
- **Verified green baseline before this session's unverified batch: Phase 9, 119/119 tests,
  all six gates green.** If the AI Generator batch can't be made green quickly, that Phase 9
  state is the safe fallback.
- **Migrations 0008 + 0009 were applied** per user output (Prisma generate + migrate deploy
  succeeded). So the DB + generated client are current; the `teamInvitation` type error is
  therefore NOT a missing-migration/stale-client problem — it points at cache/duplicate/
  stray-ref (see §9).
- **One verified module per turn** is the established cadence: implement → user runs gates →
  fix → append PROJECT_MEMORY → next. Do not batch many phases before verifying.
- `PROJECT_MEMORY.md` §1–§9 header is STALE (dated 2026-07-10, pre-Phase-8/9). Trust the
  append-only §17–§20 logs and THIS file for current state.
```
