# TODO — Release Candidate Track

> Created 2026-07-12. Companion to `PROJECT_MEMORY.md` (canonical, append-only) and
> `HANDOFF.md` (current state). Check items off; append notes, don't delete history.

## 🐛 Live-production UAT issues (2026-07-16 — "Empire Plumbing NYC" dummy-site run on Railway)
- [x] **[CRITICAL] Builder/Overview preview shows the SAMPLE business (Apex/Austin), not the user's website.**
      ✅ FIXED 2026-07-16 (M1): `buildPreviewContext` + builder seed now derive from the website's OWN
      `businessConfig` (`businessFromWizard`); sample only as last-resort fallback. Needs Railway re-test.
- [x] **[HIGH] "Deploy" doesn't produce a browsable site.** ✅ FIXED 2026-07-16 (M2–M5): full multi-page tenant
      sites now served at `/sites/<id>` (published=public, draft=owner-only) and on verified custom domains via
      the Host-header middleware rewrite; zip deploy's READY url now downloads a real static-site archive.
- [ ] **[HIGH] Auth.js redirect after the credentials callback points at `https://localhost:8080/`**
      (Railway's internal host/port) despite `AUTH_TRUST_HOST=true`. The SPA flow masks it, but server-side
      redirect flows (OAuth, magic links) would break. Fix: set `AUTH_URL=https://<public-origin>` in prod.
      **(env-only — set on Railway; no code change)**
- [ ] **[MEDIUM] Registration says "a verification link has been sent" but no email provider exists** —
      nothing is sent, and login works unverified. Fix: honest copy when no email provider is configured,
      or wire an email provider (external creds).
- [x] **[MEDIUM] "Export ZIP" returns `application/json`** ✅ FIXED 2026-07-16 (M4): export is now a REAL zip
      (verified with `unzip`) — every page as static HTML + CSS + favicon + robots + sitemap; zero JS; lead form
      posts to the app's `/api/lead` (now accepts form-encoded). `?format=config` keeps the JSON bundle.
- [x] **[LOW] Generated copy is deterministic-only** ✅ FIXED 2026-07-16 (M6): AI Generator tab shows an honest
      offline/live banner; generation warms the per-website AI content cache when a provider key is configured.

## ✅ Verified working in the same live run
Registration/login (session cookie) · website creation → GENERATED (12 blocks; correct plumbing/plumber/
blue-collar selection from NY data) · blog generation (localized — title/body mention New York + Empire) ·
async deploy QUEUED→READY via the live worker · export auth-gated · all 8 website tabs 200 · job history
on the indexed websiteId column.

## ✅ Done (verified this session — 2026-07-12)
- [x] Resolve the `teamInvitation` type-check blocker (root cause: stale Prisma client → `prisma generate`)
- [x] All six quality gates green (type-check · lint · test 136/136 · build · prisma generate · migrate deploy)
- [x] Verify the AI Generator batch compiles + the generation pipeline runs (12-block home page)
- [x] Fix `business-adapter` empty `address.street` schema violation
- [x] **Secret encryption at rest** for provider credentials (AES-256-GCM, `lib/security/secrets.ts`)
- [x] Lock in production env-validation behavior with tests (`tests/env-validation.test.mjs`)
- [x] Remove orphaned dead code (`AcceptInvitationForm.tsx`)

## ✅ Release-Engineering pass (2026-07-12)
- [x] **Async deployments** — Deployment Service refactored onto the Background Job queue;
      synchronous provider builds removed. Verified E2E (QUEUED → READY via the worker).
- [x] **Full 6-dimension production audit** (arch, security, db/perf, api, ux/a11y/seo, code quality) — see PROJECT_MEMORY §18.
- [x] Security: admin-gate AI diagnostic routes; `SECRET_ENCRYPTION_KEY` fail-closed in prod; JSON-LD `<`-escaping.
- [x] Reliability: stuck-job reaper + `maxDuration` on the worker; migration `0010_job_website_index` (indexed `Job.websiteId`).
- [x] Remove dead `framer-motion` dependency (0 imports).
- [x] A11y: modal focus-trap/restore, skip links, LeadForm labels, assertive error toasts, wizard `aria-current`, data-table `overflow-x-auto`.
- [x] API: uniform `guard()` on `jobs/actions.ts` (was missing try/catch).

## 🟨 Code-only tech debt (audit-derived; prioritized — safe to do next, none block the RC)
- [ ] **[HIGH]** Integration/E2E test harness — service layer + API routes are 0% covered (unit-only, 136 pure tests).
- [ ] **[HIGH]** Centralize the 12 `as unknown as object` Prisma-JSON writes behind one `toJson<T>()` helper.
- [ ] **[HIGH]** Validate JSON blobs on **read** through Zod (deploymentConfig, businessConfig, blog topics) instead of blind casts.
- [ ] **[MEDIUM]** Queue claim via `UPDATE … FOR UPDATE SKIP LOCKED … RETURNING` (raw SQL) + optional intra-tick concurrency.
- [ ] **[MEDIUM]** Batch `enqueueEach` with one access check + `createMany` (bulk ops N+1).
- [ ] **[MEDIUM]** Route `blog.generateBulk` through the queue (currently serial in-request, up to 20).
- [ ] **[MEDIUM]** Extract shared `resolveProviderCredentials` (dedupe deployment vs domains); unify revision-cap helper.
- [ ] **[MEDIUM]** Replace `as never` enum casts with generated Prisma enum types; resolve FK-less refs (`AiRun.websiteId`, `featuredImageId`).
- [ ] **[LOW]** Job ownership-scoping on retry/cancel; `logger.warn` on best-effort history catches; wire or delete the (currently dead) event bus + deploy→notify path.
- [ ] **[LOW]** Wire Prompt Library into the AI Generator; `prisma migrate diff` CI guard; upload content-type/AV validation; `next/image` + `next/dynamic` for media/builder; AI memory-cache LRU eviction.

## ⛔ Externally blocked (need credentials / infra — cannot complete or fabricate)
- [ ] Object storage (R2/S3) for media — needs bucket keys (interface ready; local-fs works)
- [ ] One cloud-deploy provider end-to-end — needs provider API tokens (ZIP export works)
- [x] Live AI provider calls — ✅ 2026-07-17: BYO workspace API keys (Settings → AI Providers, encrypted at rest, live test-connection); env keys still work; deterministic fallback unchanged
- [x] Running background worker — ✅ 2026-07-17: in-process worker (`instrumentation.ts`) self-ticks `/api/jobs/run` on long-lived deploys when `JOBS_WORKER_TOKEN` is set (no cron needed); external cron still supported for serverless
- [ ] Distributed rate limiter + event bus — needs Redis (in-memory works single-node)
- [ ] GA4 / Search Console analytics — needs OAuth credentials (internal metrics work)

## 🔒 Policy-deferred
- [ ] Billing (Stripe, plans, metering) — NOT to be built unless the user explicitly asks

## Definition of Done (every item)
Six gates green + `PROJECT_MEMORY.md` appended. Never mark done on unrun gates.
