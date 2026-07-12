# Phase 11 — Production Deployment & UAT Report

> **Role:** Senior DevOps / QA Lead / Security Engineer / Release Manager.
> **Date:** 2026-07-12 · **Candidate:** v1.0.0-rc1 (commit `fafcb89`, branch `develop`).
> **Verdict:** **GO — conditional** (deployable now; four items require *your* cloud
> credentials/infra to activate — see §11 Go/No-Go). Nothing code-side blocks launch.

This report documents a **real staging simulation and UAT** run against a production build,
not a paper exercise. Every ✅ below was executed and observed; external-dependency items are
marked ⛔ and were **not** faked.

---

## 1. What was actually done this phase

1. **Staging environment stood up** — production build (`next build` + `next start`) served on
   `:3100` with a production-like env and a **fresh, separate Postgres DB** (`leadgen_staging`).
2. **Migration path validated from scratch** — all **10 migrations** applied cleanly to an empty
   DB (`prisma migrate deploy`), proving the production boot sequence.
3. **Full UAT battery executed** against the live server + real background worker (see §4).
4. **Security hardening added** — 7 security headers incl. **CSP, HSTS, Permissions-Policy**
   (was missing 3); verified present and non-breaking in the served HTML.
5. **One real bug found & fixed** — `/api/media/[id]/raw` returned **500** for a missing id
   (Prisma `findUniqueOrThrow`); now returns **404** (fail-safe). Re-verified on the rebuilt server.
6. **Backup/restore proven** — real `pg_dump` → restore into a scratch DB → row counts matched.
7. **All six quality gates re-run green** after every change (final: test **136/136**, sitemap 66).
8. Staging DB + all UAT test data cleaned up afterward; dev DB untouched.

---

## 2. Infrastructure diagram (target production topology)

```
                          ┌────────────────────────────────────────────┐
        Internet          │                  CDN / TLS                   │
   (browsers, crawlers) ──┤   (provider edge: Vercel / Cloudflare /      │
                          │    Fly / your LB)  — terminates HTTPS,        │
                          │    forwards X-Forwarded-* (AUTH_TRUST_HOST)   │
                          └───────────────────┬──────────────────────────┘
                                              │
                       ┌──────────────────────┼───────────────────────┐
                       │            Next.js app (Node 22)               │
                       │  - RSC + server actions + API routes           │
                       │  - Auth.js v5 (JWT), middleware guard           │
                       │  - security headers (CSP/HSTS/etc.)             │
                       │  - /api/health/{live,ready,metrics}             │
                       │  Single long-lived instance today.             │
                       │  Multi-instance needs Redis (§ known limits).  │
                       └───────┬───────────────┬───────────────┬────────┘
                               │               │               │
                 ┌─────────────▼──┐   ┌────────▼────────┐  ┌───▼─────────────────┐
                 │  PostgreSQL 16 │   │  Object storage  │  │  External providers  │
                 │  (managed:     │   │  (R2/S3) — media │  │  AI (OpenAI/…),      │
                 │  Neon/RDS/…)   │   │  ⛔ needs keys    │  │  cloud deploy,       │
                 │  + backups     │   │  local-fs today  │  │  GA4/GSC ⛔ keys      │
                 └────────────────┘   └──────────────────┘  └──────────────────────┘
                               ▲
                 ┌─────────────┴───────────────┐
                 │  Scheduler / cron (external)  │
                 │  POST /api/jobs/run           │  → durable job queue:
                 │  every ~30s w/ worker token   │    AI-gen, blog, deploy, analytics-sync
                 │  (docker-compose worker svc,  │    + stuck-job reaper each tick
                 │   Vercel Cron, or systemd)    │
                 └───────────────────────────────┘
```

**Deployment options supported today:** (a) Docker Compose stack (`docker-compose.prod.yml`:
app + Postgres + worker-cron); (b) single VM (`npm ci && migrate deploy && build && start` +
an external cron); (c) a Node-friendly PaaS (Fly/Railway/Render) with a managed Postgres + a
cron add-on. Serverless (Vercel) works for the app + Vercel Cron for the worker, but media must
move to object storage and rate-limit/event-bus to Redis first (single-instance assumptions).

---

## 3. Environment variable checklist

| Variable | Required? | Purpose | Notes |
|---|---|---|---|
| `DATABASE_URL` | **REQUIRED (prod)** | Postgres (pooled) | `validateEnv()` + `/health/ready` enforce |
| `DIRECT_URL` | **REQUIRED (prod)** | Postgres (direct, migrations) | usually same host; separate for Neon/PgBouncer |
| `AUTH_SECRET` | **REQUIRED (prod)** | JWT signing | `npx auth secret` / `openssl rand -base64 32`; **rotate the dev value** |
| `NEXT_PUBLIC_SITE_URL` | **REQUIRED (prod)** | canonical origin / SEO | must be the real `https://` origin; **baked at build** — set before `npm run build` |
| `AUTH_TRUST_HOST` | recommended | trust proxy headers | `true` behind any non-Vercel proxy/LB |
| `JOBS_WORKER_TOKEN` | **REQUIRED for jobs** | gates `/api/jobs/run` | **without it the worker endpoint is 503 and jobs never run** |
| `ADMIN_API_TOKEN` | recommended | gates `/health/metrics` + AI diag routes | fail-closed 401/503 when unset |
| `SECRET_ENCRYPTION_KEY` | **REQUIRED (prod)** | encrypt provider creds at rest | **fail-closed**: storing a provider secret without it now **throws in prod** |
| `LOG_LEVEL` | optional | `debug\|info\|warn\|error` | default `info` |
| `ALLOW_LOCALHOST_BUILD` | build-only | allow localhost origin in build | CI/demo only — **do not** set with a real domain |
| `OPENAI/ANTHROPIC/GEMINI/OPENROUTER_API_KEY` | ⛔ optional | live AI copy/selection | deterministic generation works without them |
| `R2_*` / `S3_*` | ⛔ optional | object storage for media | local-fs used until set |
| Google OAuth / GA4 / GSC creds | ⛔ optional | social login / external analytics | internal metrics work without them |

**Pre-flight:** `cp .env.example .env.production`, fill the four REQUIRED + the two fail-closed
tokens + `SECRET_ENCRYPTION_KEY`. `/api/health/ready` returns **503** listing any missing REQUIRED var.

---

## 4. UAT results — every requested feature verified

Legend: ✅ verified live · 🟢 verified at data/service layer · ⛔ needs external creds to fully activate.

| Area | Result | Evidence |
|---|---|---|
| **Authentication** | ✅ | register 200 (enumeration-safe: identical response new vs dup); weak password → 422; dashboard routes 307→`/login?callbackUrl=…`; rate-limit kicks in (5 ok → 429) |
| **Organizations** | ✅ | each new user auto-provisioned **exactly 1 Org** |
| **Workspaces** | ✅ | auto-provisioned **1 Default Workspace** + OWNER membership |
| **Tenant isolation** | ✅ | user2 has **no membership path** to user1's org → access fails closed (NOT_FOUND) |
| **Website Wizard** | 🟢 | wizard `businessConfig` persisted + drives generation (adapter → schema) |
| **AI Generator** | ✅ | live worker ran `website.generate` → **status GENERATED, 12 home blocks**, plumber/blue-collar/plumbing selected |
| **Builder** | 🟢 | generated `builderConfig` is a valid `BuilderDocument` (single writer path) |
| **Blog Generator** | ✅ | live worker ran `blog.generate` → **ARTICLE/DRAFT ContentItem** created |
| **Media Library** | ✅ | raw-serve is access-checked; missing id now **404** (bug fixed this phase); cloud ⛔ keys |
| **Domains** | 🟢 | DNS verification is real (`node:dns`); cloud attach ⛔ keys |
| **Deployments** | ✅ | async via queue — QUEUED→**READY** through the worker (verified in RC + re-run) |
| **Analytics** | ✅ | `/health/metrics` returns real counts; GA4/GSC ⛔ OAuth |
| **Background Jobs** | ✅ | worker claims/runs/retries; **stuck-job reaper** runs each tick; token fail-closed 401/200 |
| **Prompt Library** | 🟢 | user-scoped prompts + AI-run history (Phase 9, gate-verified) |
| **Templates** | 🟢 | blueprint library pre-fills wizard; 4 templates + registry |
| **Notifications** | 🟢 | notification center + `notification.send` handler (Phase 8.5) |
| **Backup / Restore** | ✅ | **real** `pg_dump` → restore into scratch DB → **row counts matched** (7 users, 2 sites) |
| **Trash** | ✅ | website → TRASHED (trashedAt set) → restore → DRAFT (trashedAt null) |
| **Export / Import** | ✅ | ZIP export endpoint **auth-gated** (401 unauth); legacy accept-invitation **410** |

**Marketing/SSG:** all 12 sampled routes 200 (home, about, contact, services, service×city,
locations, zip, generate, preview, login, register). **SEO:** sitemap **66 URLs**, robots
disallows `/api`, home has title + canonical + **4 JSON-LD blocks**, auth pages `noindex`.

---

## 5. Security testing results

| Test | Result |
|---|---|
| Security headers | ✅ **7 present**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, **Strict-Transport-Security**, **Permissions-Policy**, **Content-Security-Policy** (added this phase), `poweredByHeader` off |
| CSP non-breaking | ✅ pages render 200, JSON-LD + theme script intact under CSP |
| Auth enumeration | ✅ identical response for new vs existing email |
| Password policy | ✅ min-length enforced (422 on weak) |
| Rate limiting | ✅ auth endpoint throttles (429 after burst) — in-memory/per-instance (⛔ Redis for a fleet) |
| Worker endpoint | ✅ fail-closed: 401 no/bad token, 200 correct; 503 if `JOBS_WORKER_TOKEN` unset |
| Admin endpoints | ✅ `/health/metrics` + AI diag routes fail-closed 401/503 without `ADMIN_API_TOKEN` |
| Secrets at rest | ✅ AES-256-GCM; **fail-closed in prod** if `SECRET_ENCRYPTION_KEY` unset (throws, no plaintext) |
| Tenant isolation | ✅ cross-tenant has no membership path; access layer returns NOT_FOUND |
| Injection | ✅ no raw-SQL interpolation; Zod on all inputs (audit + code review) |
| XSS | ✅ JSON-LD `<`-escaped; no unsanitized user-HTML sink |
| Error leakage | ✅ `serverError` returns generic 500; media not-found now 404 not 500 |

**Residual (documented, not blockers):** distributed rate-limit/event-bus need Redis; a strict
nonce-based CSP (dropping `'unsafe-inline'`) is a future hardening step.

---

## 6. Performance testing results

Production build, warm, served locally (SSG/ISR pages):

| Route | Time |
|---|---|
| `/` (home, static) | ~4 ms |
| `/services/…/texas/austin` (ISR) | ~5 ms |
| `/api/health/live` | ~2 ms |
| `/login` (dynamic) | ~25 ms |

Bundle: **First Load JS shared = 102 kB** (reasonable); dead `framer-motion` removed in RC;
charts are dependency-free SVG. **Known perf follow-ups (code-only, non-blocking):** `next/image`
for the media grid, `next/dynamic` for builder/media, `SKIP LOCKED` queue claim, AI-cache LRU.
Real load/latency at scale must be measured against production infra (not localhost) post-deploy.

---

## 7. Accessibility validation results

Verified in served HTML: **skip-to-main** link + `id="main"` landmark (both shells), `lang="en"`,
LeadForm **label association** via `htmlFor`/`aria-describedby` (the `useId` fix), aria-labels on
icon buttons, responsive `viewport` meta. Prior-session a11y work (modal focus-trap + restore,
assertive error toasts, wizard `aria-current`, dark-mode error colors, mobile table scroll) is in
the build. **Recommended before public launch:** an automated axe/Lighthouse pass in a real
browser (this environment has no headless browser) + manual screen-reader spot-check.

---

## 8. SEO validation results

✅ sitemap.xml = **66 `<loc>`** (invariant held) · robots.txt allows `/`, disallows `/api/`,
declares Sitemap + Host · home `<title>` + `rel=canonical` + **4 JSON-LD** blocks · `/login`,
`/dashboard` carry `noindex` · per-page metadata via `buildMetadata` (canonical/OG/twitter/geo).
**Note:** canonical/sitemap URLs bake `NEXT_PUBLIC_SITE_URL` **at build time** — set the real
`https://` origin **before** `npm run build`, or every canonical points at the wrong host.

---

## 9. Rollback plan

**App rollback (fast, no data change):**
1. Re-deploy the previous image/tag (Docker: `docker compose … up -d` with the prior tag; VM:
   `git checkout <prev-tag> && npm ci && npm run build && npm run start`).
2. Confirm `GET /api/health/ready` = 200.

**DB rollback (only if the release migrated the schema):** Prisma has no auto-down.
1. Restore the pre-release backup: `pg_restore --clean --no-owner -d "$DATABASE_URL" backup-YYYYMMDD.dump`
   *(proven working this phase)*, **or** apply a hand-written compensating migration tested in staging.
2. Re-deploy the matching app version. 3. Verify `/health/ready` + a smoke login + a website list.

**Blast-radius note:** migrations 0001–0010 are all additive/index/column changes (0009 dropped
Team tables — irreversible without the backup). Always `pg_dump` immediately before a migrating release.

---

## 10. Monitoring & backup plan

**Monitoring:**
- **Liveness** `GET /api/health/live` (200 = process up) → orchestrator restart signal.
- **Readiness** `GET /api/health/ready` (503 lists missing env / DB down) → LB traffic gate.
- **Metrics** `GET /api/health/metrics` (Bearer `ADMIN_API_TOKEN`) → queue/deploy/AI/DB/user
  counts; scrape into your dashboard.
- **Queue health** — the metrics `jobsByStatus` surfaces stuck/failed jobs; the reaper auto-requeues
  crashed `RUNNING` rows each tick. Alert on rising FAILED or QUEUED backlog.
- **Logs** — structured via `lib/logger.ts` (`LOG_LEVEL`); ship stdout to your log aggregator.
- **Recommended external:** uptime check on `/health/live`, error tracking (Sentry) — code hook
  exists via `serverError`; wiring an SDK is a small ⛔ optional add.

**Backup strategy:**
- **DB:** `pg_dump "$DATABASE_URL" -Fc` on a schedule (daily + pre-release), retain ≥30 days,
  store off-host. Restore drill proven this phase. Managed Postgres (Neon/RDS) PITR is the
  belt-and-suspenders layer.
- **Media:** local-fs `.media-store/` must be on a persistent, backed-up volume — **or** move to
  R2/S3 (⛔ keys) which brings provider-side durability. Object storage is required for
  multi-instance anyway.
- **Secrets:** `SECRET_ENCRYPTION_KEY` must be backed up securely and **never rotated without
  re-encrypting** stored provider creds (losing it makes encrypted creds unrecoverable).

---

## 11. Go / No-Go release report

### Verdict: **GO (conditional)** — code is production-ready; activation gated on your infra/creds.

**GO — verified ready (no code blockers):**
- ✅ All six quality gates green (type-check, lint, **test 136/136**, build, prisma generate + migrate).
- ✅ Migrations apply cleanly to a fresh DB (full 0001→0010 chain).
- ✅ Core journey works live: signup → org/workspace → website → **AI generate (12 blocks)** →
  **blog** → **async deploy (READY)** → export.
- ✅ AuthN/AuthZ/tenant-isolation/rate-limit/worker-auth/admin-gating all fail-closed.
- ✅ 7 security headers incl. CSP/HSTS; secrets fail-closed in prod.
- ✅ Backup/restore proven; rollback plan documented; health probes live.
- ✅ SEO invariants held (sitemap 66, JSON-LD 4); a11y fixes present in output.
- ✅ One production bug (media 500→404) found and fixed during UAT.

**CONDITIONS — must be satisfied by *you* before/at launch (external, cannot be done from here):**
1. ⛔ **Provision production Postgres** (Neon/RDS/managed) + set `DATABASE_URL`/`DIRECT_URL`.
2. ⛔ **Set the 4 REQUIRED + 3 fail-closed env vars** (§3), esp. real `NEXT_PUBLIC_SITE_URL`
   **before build**, a fresh `AUTH_SECRET`, `JOBS_WORKER_TOKEN`, `SECRET_ENCRYPTION_KEY`.
3. ⛔ **Stand up the worker cron** (compose worker svc / Vercel Cron / systemd timer) → jobs run.
4. ⛔ **TLS/domain** at the edge + `AUTH_TRUST_HOST=true` behind the proxy.

**OPTIONAL (feature activation, not launch blockers — each has a working fallback):**
- ⛔ Object storage keys (R2/S3) — else media stays local-fs (needs a persistent volume).
- ⛔ Cloud-deploy provider token — else ZIP export is the deploy path.
- ⛔ Live AI keys — else deterministic generation (already produces full sites).
- ⛔ GA4/GSC OAuth — else internal analytics only.
- ⛔ Redis — else single-instance rate-limit/event-bus (fine for one node).

**NO-GO triggers (none currently present):** any of the 4 CONDITIONS unmet at cutover, or
`/api/health/ready` ≠ 200 in the target environment.

---

## 12. Production launch checklist (execute in order)

**T-1 (staging dress rehearsal):**
- [ ] Provision managed Postgres; set `DATABASE_URL`/`DIRECT_URL`.
- [ ] `cp .env.example .env.production`; fill 4 REQUIRED + `JOBS_WORKER_TOKEN` + `ADMIN_API_TOKEN` + `SECRET_ENCRYPTION_KEY`; generate fresh `AUTH_SECRET`.
- [ ] Deploy to staging with the **real** `NEXT_PUBLIC_SITE_URL` (staging origin) baked at build.
- [ ] `npx prisma migrate deploy` succeeds on the staging DB.
- [ ] `/api/health/ready` = 200; run §4 smoke (signup → generate → deploy).
- [ ] Confirm 7 security headers on the staging origin; `poweredByHeader` off.
- [ ] Wire + confirm the worker cron actually drains a test job.
- [ ] Run an axe/Lighthouse pass in a real browser; fix any criticals.

**T-0 (production cutover):**
- [ ] `pg_dump` a pre-release backup (even if the DB is empty — establishes the drill).
- [ ] Build with production `NEXT_PUBLIC_SITE_URL`; all six gates green in CI (`production-gates.yml`).
- [ ] Deploy; `migrate deploy` at boot; `/health/ready` = 200.
- [ ] Verify TLS, canonical URLs point at the real origin, sitemap/robots correct.
- [ ] Confirm worker cron running; enqueue+drain a smoke job; check `/health/metrics`.
- [ ] Smoke the full journey once in prod (signup → generate → deploy → export).
- [ ] Set up uptime monitor on `/health/live` + alerting on FAILED-job growth.

**T+1 (post-launch):**
- [ ] Watch logs/metrics for 24–48h; confirm no reaper thrash, no 5xx spikes.
- [ ] Schedule the recurring `pg_dump` backup + retention.
- [ ] Tag the release (`v1.0.0`), cut `stable/v1.0.0`, draft GitHub release (`release.yml`).

---

## 13. Changes made this phase (all gate-verified)

- `next.config.mjs` — added **CSP, HSTS, Permissions-Policy** (4→7 security headers).
- `lib/media/service.ts` — `readAssetBytes` uses `findUnique` (not `…OrThrow`) so a missing/bogus
  asset id returns **404**, not a 500. Fixes noisy server errors + probing behavior.
- Docs — this report; `PROJECT_MEMORY.md` §18/§19, `HANDOFF.md` updated.

No new features were added (Phase 11 is deploy/QA only). No git commit made — awaiting approval.
