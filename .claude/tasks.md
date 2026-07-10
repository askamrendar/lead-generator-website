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

### T-010 · Phase 7.2 — Authenticated product surface + Visual Builder
- **Description:** the authenticated product on the 7.1 foundation, culminating in the
  Visual Builder. Approved sub-milestone order (verify + stop + present after each):
  **7.2.0** Tenant Access Guard (`T-035`) → **7.2.1** Auth UI → **7.2.2** Dashboard
  Foundation (shell → Workspace/Project/Website CRUD) → **7.2.3** Website Manager
  (management surface) → **7.2.4** Visual Builder (editor → `Website.builderConfig`) →
  **7.2.5** Production Route Adoption (flag, SEO parity). Manager manages; Builder edits —
  responsibilities kept separate; no second builder format.
- **Dependencies:** 7.1 (done); `T-035` guard before any CRUD; `T-036` live migration at 7.2.2.
- **Complexity:** L. **Files:** `lib/auth/access/` (done), `app/(auth)/…` (done),
  `app/(dashboard)/…`, `components/dashboard/`, `components/builder/editor/` (reuse `lib/builder`).
- **Progress:** **7.2.0 ✅** (`lib/auth/access/`), **7.2.1 ✅** (auth UI), **7.2.2 ✅**
  (dashboard shell), **7.2.3 ✅** (Website Manager — `lib/websites/` service via tenant-access,
  creation wizard, list + detail shell with tabs; `Website` schema extended, migration 0002).
  Next: **7.2.4** AI Website Generator (wizard config → generation via the existing AI engine).
- **Acceptance:** tenant-isolated CRUD; non-dev edits + previews a page; production routes
  render via `BlockRenderer` with routes/SEO byte-identical; gates green after each milestone.

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

### T-020 · Auth & Organizations (`lib/auth/`, `lib/db/`) — ✅ Done (Phase 7.1)
- **Description:** accounts, sessions, orgs/teams, RBAC, database (Prisma + Postgres);
  ownership `Organization → Workspace → Project → Website`. **Unblocks**
  Dashboard/Admin/Billing/Deployment.
- **Delivered:** Auth.js v5 (Credentials + Google/GitHub, JWT), Prisma 6/Postgres
  (14 models + migration), Docker dev DB + Neon docs, RBAC, register/verify/reset APIs,
  middleware guard, auto-provisioning; 4 gates green (test 40/40); sitemap 66 preserved.
- **Resequenced** from P2/"Phase 10" to **Phase 7.1** by explicit instruction. Remaining:
  live DB migration (developer-run), OAuth secrets, email provider, dashboard UI (T-021).

### T-021 · Customer Dashboard (`app/dashboard/`) — Blocked by T-020
### T-022 · Admin console (`app/admin/`, `lib/admin/`) — Blocked by T-020
### T-023 · Billing / credits (`lib/billing/`) — Blocked by T-020

## P3 — scale & later
### T-030 · Deployment / custom domains (`lib/deployment/`) — Blocked by T-020, T-023
### T-031 · Analytics (`lib/analytics/`) — Blocked by T-020
### T-032 · Shared rate-limit/cache store (Redis/Upstash) + edge CSP/HSTS
### T-033 · Pin exact dependency versions for a hardened release
### T-034 · Resolve pre-existing unused local `lib/generator/content.ts:220`

## Phase 7.1 architecture-review follow-ups (logged 2026-07-10; not yet implemented)
### T-035 · Tenant-access guard (`lib/auth/access/`) — ✅ Done (Phase 7.2.0)
- Delivered the centralized authorization layer: pure engine + `require*Access`
  resolver (registry-extensible) + `*Scope` helpers + `AccessError`/HTTP mapping;
  tenant-hiding + fail-closed; 57/57 tests. The single supported way to read tenant
  resources — 7.2.2+ CRUD must route every query through it.
### T-036 · Apply + verify the initial Prisma migration against a live DB (M4)
- `docker compose up -d db` (or Neon) → `prisma migrate deploy`; confirm clean apply. **P1.**
### T-037 · Auth error→HTTP mapper for `UNAUTHENTICATED`/`FORBIDDEN` (session helpers). **P2.**
### T-038 · Ownership-transfer semantics for `Project.owner` (FK is `Restrict`) (M3). **P2.**
### T-039 · Enforce `emailVerified` login policy; POST-confirm email verification (M2/L1). **P2.**
> H1 (`trustHost`) + M1 (register enumeration) — **done** in production hardening (0.7.0-alpha).

## Recommended execution order
T-001 Logging → T-011 Blog → T-012 CRM → T-013 Media → T-020 Auth →
T-010 Visual Builder / T-021 Dashboard → T-023 Billing → T-030 Deployment →
T-031 Analytics. (Value ÷ dependency; see `NEXT_RELEASE_PLAN.md`.)
