# HANDOFF — Lead Generator Website

**Date:** 2026-07-12 · **Fuller context:** `SESSION_HANDOFF.md` · **History:** `PROJECT_MEMORY.md` (append-only)

---

## Current branch
`develop` (all Phase 7–10 + Release-Engineering work; uncommitted. Production `main` = v0.6.0.) No git writes without approval.

## Last completed task
**Phase 11 — Production Deployment & UAT** (2026-07-12). Real staging simulation (prod build +
fresh Postgres DB), full UAT battery, security/perf/a11y/SEO testing, and a **GO (conditional)**
Go/No-Go report. Two fixes made + gate-verified: added CSP/HSTS/Permissions-Policy headers; fixed
a media-raw 500→404 bug. Full report: `docs/PHASE_11_DEPLOYMENT_UAT.md`. All six gates green
(**136/136**, sitemap 66). See `PROJECT_MEMORY.md` §18/§19.

## Deploy verdict: GO (conditional)
Code is production-ready. Launch is gated only on **external** items you must provide: a managed
Postgres, the 4 REQUIRED + 3 fail-closed env vars (esp. real `NEXT_PUBLIC_SITE_URL` **before**
build, fresh `AUTH_SECRET`, `JOBS_WORKER_TOKEN`, `SECRET_ENCRYPTION_KEY`), a worker cron hitting
`/api/jobs/run`, and TLS/domain. See the launch checklist in `docs/PHASE_11_DEPLOYMENT_UAT.md` §12.

## Current gate status (self-run 2026-07-12, all GREEN)
```
prisma generate            ✓
prisma migrate deploy      ✓  (10 migrations, in sync — added 0010_job_website_index)
npm run type-check         ✓
npm run lint               ✓  (No ESLint warnings or errors)
npm test                   ✓  136/136
ALLOW_LOCALHOST_BUILD=1 npm run build   ✓  (sitemap = 66 URLs)
```
Local DB: `postgresql://$(whoami)@localhost:5432/leadgen?schema=public` (env in `.env.local`).

## Production audit scores (0–100) — 6 specialist reviewers over the real code
| Dimension | Before | After fixes |
|---|---|---|
| Production readiness | 78 | **~84** |
| Architecture | 86 | 86 |
| Code quality | 86 | 86 |
| Maintainability | 78 | 78 |
| Scalability | 56 | **~70** |
| Security | 83 | **~88** |
| Performance | 68 | **~74** |
| Database | 74 | **~82** |
| API | 78 | **~84** |
| UX / a11y / SEO | 79 | **~85** |

("After" = my estimate reflecting the fixes below; the raw reviewer numbers predate them.)

## What changed this session (all gate-verified)
**Async deployments (verified E2E twice):** deployment service no longer builds inside a request —
`createDeployment`/`retryDeployment` create a QUEUED row + enqueue `deployment.run`; the worker runs
`runDeployCore`. QUEUED→READY confirmed via a live worker hit.
**Security:** admin-gated the 3 anon-reachable AI diagnostic routes (503 fail-closed, runtime-verified);
`SECRET_ENCRYPTION_KEY` now fail-closed in production (`encryptSecret` throws vs. silent plaintext); JSON-LD `<`-escaping.
**Reliability/scale:** stuck-job reaper (`reapStuckJobs`+`isStuck`) in the worker tick + `maxDuration=60`;
migration `0010_job_website_index` (indexed `Job.websiteId` replacing a JSON-path scan; +reaper index); removed dead `framer-motion`.
**API:** uniform `guard()` on `jobs/actions.ts`.
**A11y/UX:** modal focus-trap + focus-restore; skip-to-main on both shells; LeadForm label/error association;
assertive error toasts; wizard `aria-current`; dark-mode error-text variants; mobile data-table `overflow-x-auto`.

## Remaining work — what I CAN do (code-only) vs. what is EXTERNALLY BLOCKED

**Code-only tech debt (audit-derived, prioritized — see `TODO.md`; none block the RC):**
- [HIGH] integration/E2E harness (unit-only today); centralize Prisma-JSON writes behind `toJson<T>()`; Zod-validate JSON blobs on read.
- [MEDIUM] queue claim via `SKIP LOCKED` + intra-tick concurrency; batch bulk-enqueue with `createMany`; route `blog.generateBulk` through the queue; dedupe credential/revision helpers; replace `as never` enum casts; resolve FK-less refs.
- [LOW] job ownership-scoping; wire-or-delete the event bus + deploy→notify; Prompt Library → AI Generator; `next/image`/`next/dynamic`; AI memory-cache LRU.

**EXTERNALLY BLOCKED (need credentials / infrastructure — cannot fabricate):**
- **Object storage (R2/S3)** — needs bucket keys (interface ready; local-fs works).
- **A cloud-deploy provider end-to-end** — needs provider API tokens (ZIP export works).
- **Live AI calls** (OpenAI/Anthropic/Gemini) — needs API keys (deterministic works offline).
- **Running background worker** — needs an external cron → `POST /api/jobs/run` + `JOBS_WORKER_TOKEN` (queue+reaper built).
- **Distributed rate limiter + event bus (Redis)** — needs a Redis instance (in-memory works single-node).
- **GA4 / Search Console** — needs OAuth credentials (internal metrics work).

## Rules (do not break)
- Single-user only — never reintroduce Team. Keep Organization/Workspace/Membership and `lib/auth/access`. Never bypass `require*Access`.
- Reuse existing engines — no duplicate generation logic. Builder edits pages only; Deployment never edits content.
- Never claim a gate passed without real output. Append `PROJECT_MEMORY.md`; never overwrite. No commit/push/tag without explicit approval.
- Preserve SEO invariants: sitemap 66, home JSON-LD 4, marketing home static.

## Environment note
Bash IS available this session — gates were self-run (not user-pasted). Postgres runs locally (Homebrew).
Env from `.env.local` (git-ignored). Migration `0010` was created via `migrate dev` then renamed to the
`NNNN_name` convention + the `_prisma_migrations` record updated to match (repo consistency).
