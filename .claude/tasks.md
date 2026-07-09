# Master Backlog

> Priority: **P0** (now/critical) · **P1** (next) · **P2** (soon) · **P3** (later).
> Status: Pending · In Progress · Done · Blocked. Keep in sync with
> [`PROJECT_MANIFEST.md`](../PROJECT_MANIFEST.md) (canonical "current/next task") and
> [`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md). Add new tasks here as they arise.

## P0 — foundational quality (do continuously / before big features)

### T-001 · Structured logging (`lib/logging/`)
- **Description:** logger abstraction to replace ad-hoc `console.*`; request/audit
  logging; provider adapter seam (Sentry/OTel later).
- **Dependencies:** none (cross-cutting). **Complexity:** S.
- **Files:** new `lib/logging/`, adopt in `lib/api/*`, `lib/ai/*`, `app/api/*`.
- **Acceptance:** one logging entry point; no bare `console.*` in server code; tests;
  build green; docs updated.

### T-002 · Expand test coverage (component + route/render integration)
- **Description:** Testing is the weakest category (5/10). Add component/DOM tests
  and route/render integration; add coverage reporting to CI.
- **Dependencies:** may add a test runner (record decision in `.claude/decisions.md`).
- **Complexity:** M. **Files:** `tests/`, `.github/workflows/ci.yml`.
- **Acceptance:** render/route smoke tests pass; coverage visible in CI; gates green.

## P1 — near-term, low/no new infrastructure

### T-010 · Phase 7 — Visual Builder
- **Description:** live editor over the block/theme engine (drag-order, edit props,
  switch theme/template, preview, persist `PageDefinition`); adopt `BlockRenderer`
  on production routes behind a flag.
- **Dependencies:** existing builder engine; persistence (JSON export first, DB later).
- **Complexity:** L. **Files:** `app/(builder)/…`, `components/builder/editor/`, `lib/builder/*`.
- **Acceptance:** non-dev edits + previews a page; production routes render via
  `BlockRenderer` with routes/SEO byte-identical; gates green.

### T-011 · Phase 8 — Blog pages
- **Description:** publish existing blog generators as routes (article/category/tag),
  RSS, Article JSON-LD, sitemap + internal-link wiring.
- **Dependencies:** `lib/ai/services/blog.ts` (exists), `lib/seo`. **Complexity:** M.
- **Files:** `app/blog/**`, new `lib/blog/`, `app/sitemap.ts`.
- **Acceptance:** blog routes build statically; valid RSS; Article schema; sitemap includes posts.

### T-012 · CRM / lead delivery (`lib/crm/`)
- **Description:** implement the `app/api/lead` delivery seam — persistence + email
  adapter, dedupe, status, export. Extends `lib/leads/`.
- **Dependencies:** a datastore. **Complexity:** M.
- **Acceptance:** submitted lead persisted + delivered; failures degrade gracefully; tests.

### T-013 · Media / Image engine (`lib/media/`, `public/`)
- **Description:** turn `image-prompts.ts` output into real optimized assets + alt text.
- **Dependencies:** image provider + storage. **Complexity:** M.
- **Acceptance:** hero/OG/service images render; CWV unaffected; alt on every image.

## P2 — SaaS foundation

### T-020 · Auth & Organizations (`lib/auth/`, `app/(auth)/`) — CRITICAL PATH
- **Description:** accounts, sessions, orgs/teams, RBAC, database (Prisma + Postgres);
  tenant-scope every business config. **Blocks** Dashboard/Admin/Billing/Deployment.
- **Complexity:** L. **Acceptance:** auth flows + protected routes + tenant isolation; tests.

### T-021 · Customer Dashboard (`app/dashboard/`) — Blocked by T-020
### T-022 · Admin console (`app/admin/`, `lib/admin/`) — Blocked by T-020
### T-023 · Billing / credits (`lib/billing/`) — Blocked by T-020

## P3 — scale & later
### T-030 · Deployment / custom domains (`lib/deployment/`) — Blocked by T-020, T-023
### T-031 · Analytics (`lib/analytics/`) — Blocked by T-020
### T-032 · Shared rate-limit/cache store (Redis/Upstash) + edge CSP/HSTS
### T-033 · Pin exact dependency versions for a hardened release
### T-034 · Resolve pre-existing unused local `lib/generator/content.ts:220`

## Recommended execution order
T-001 Logging → T-011 Blog → T-012 CRM → T-013 Media → T-020 Auth →
T-010 Visual Builder / T-021 Dashboard → T-023 Billing → T-030 Deployment →
T-031 Analytics. (Value ÷ dependency; see `NEXT_RELEASE_PLAN.md`.)
