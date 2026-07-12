# Production Deployment Guide (Phase 10.4)

Supersedes the SaaS-era sections of `DEPLOYMENT.md` for the full app (auth + DB +
background jobs). The app runs as a **single long-lived Node instance** today;
multi-instance/serverless needs the follow-ups in Section 10.

## 1. Prerequisites

- Node 22, PostgreSQL 16.
- Copy `.env.example` → fill in. Production **requires**: `DATABASE_URL`, `DIRECT_URL`,
  `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`. `lib/env.ts` `validateEnv()` reports missing
  vars; `/api/health/ready` returns 503 until they are present.

## 2. Quality gates (before every release)

```bash
npx prisma generate
npx prisma migrate deploy
npm run type-check
npm run lint
npm test
ALLOW_LOCALHOST_BUILD=1 npm run build
```

CI runs the same six gates on push (`.github/workflows/production-gates.yml`) and on
version tags (`.github/workflows/release.yml`).

## 3. Deploy with Docker

```bash
cp .env.example .env.production   # fill in real secrets
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

- `app` applies migrations at boot then starts.
- `worker` polls `POST /api/jobs/run` every 30s (needs `JOBS_WORKER_TOKEN`) so queued
  jobs (AI generation, blog, deploy) process. **Without a worker, jobs queue but never run.**

## 4. Deploy without Docker (single VM)

```bash
npm ci
npx prisma migrate deploy
NEXT_PUBLIC_SITE_URL=https://yourdomain.com npm run build
npm run start
# Separately: cron a POST /api/jobs/run with the worker token every ~30s.
```

## 5. Health endpoints (Task 8)

| Endpoint | Purpose | Auth |
| --- | --- | --- |
| `GET /api/health/live` | Liveness (process up) | none |
| `GET /api/health/ready` | Readiness (DB + env); 503 if not ready | none |
| `GET /api/health/metrics` | Queue/deploy/AI/DB counts | `ADMIN_API_TOKEN` (Bearer) |

## 6. Migrations & rollback

- Apply: `npx prisma migrate deploy` (idempotent).
- No auto-down. Roll back by restoring the pre-release backup (Section 7) or applying a
  hand-written compensating migration — test it in staging first.

## 7. Backup & restore

```bash
pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%Y%m%d).dump          # before each release
pg_restore --clean --no-owner -d "$DATABASE_URL" backup-YYYYMMDD.dump
```

Local media lives in `.media-store/` — back it up, or use the R2/S3 provider.

## 8. Application rollback

1. Re-deploy the previous image/tag (Docker) or check out the previous tag and rebuild (VM).
2. If the release migrated the DB, restore the pre-release backup or apply the compensating migration.
3. Confirm `/api/health/ready` = 200.

## 9. Release process

1. All six gates green locally.
2. `git tag -a vX.Y.Z -m "…" && git push origin vX.Y.Z`.
3. `release.yml` re-runs gates, builds the Docker image, uploads the build artifact, opens
   a **draft** GitHub release. Publish after review. **Never auto-deploy to production.**

## 10. Known production follow-ups (not yet done)

- **Media storage** local-fs by default → R2/S3 for multi-instance.
- **Rate limiter + event bus** in-memory/per-instance → Redis for a fleet.
- **Provider secrets** plaintext unless `SECRET_ENCRYPTION_KEY` + the secret service are enabled.
- **The AI Generator batch + Tasks 6–9 are implemented but NOT yet gate-verified** in this
  working tree — verify (Section 2) before releasing.
