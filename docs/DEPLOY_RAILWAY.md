# Deploying to Railway (Hobby plan)

> Tested topology: **app service (Dockerfile)** + **Postgres plugin** + **cron worker**.
> Matches the Phase 11 verified architecture (`docs/PHASE_11_DEPLOYMENT_UAT.md`).
> `railway.json` in the repo root configures the build + health check automatically.

---

## 1 · Create the project

1. Railway dashboard → **New Project** → **Deploy from GitHub repo** → pick
   `askamrendar/lead-generator-website`, branch **`develop`** (or the `v1.0.0` tag).
2. Railway detects the `Dockerfile` via `railway.json` — no build settings needed.
3. The first build will succeed but the app will crash-loop until the env vars in §3 exist —
   that's expected; finish the steps below and redeploy.

## 2 · Add Postgres

1. In the project: **+ New** → **Database** → **PostgreSQL**.
2. Railway creates it and exposes `DATABASE_URL` as a reference variable.

## 3 · App service → Variables

Set these on the **app** service (Variables tab). Generate each secret with
`openssl rand -base64 32` (or any long random string):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `DIRECT_URL` | `${{Postgres.DATABASE_URL}}` (same — Railway PG has no separate pooler) |
| `AUTH_SECRET` | *(fresh random — do NOT reuse the dev value)* |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_SITE_URL` | your public URL, e.g. `https://<app>.up.railway.app` — see §4 |
| `JOBS_WORKER_TOKEN` | *(fresh random)* |
| `ADMIN_API_TOKEN` | *(fresh random)* |
| `SECRET_ENCRYPTION_KEY` | *(fresh random — required in prod; the app refuses to store provider creds without it)* |
| `LOG_LEVEL` | `info` |

> Migrations run automatically at boot (`prisma migrate deploy` in the Dockerfile CMD).

## 4 · The build-time URL gotcha (important)

`NEXT_PUBLIC_SITE_URL` is **baked into the client bundle at build time** — it drives every
canonical URL, sitemap entry, and OG tag. The Dockerfile declares it as a build `ARG`, and
Railway passes service variables to Docker builds automatically, so:

1. First deploy → note the generated domain (Settings → Networking → Generate Domain),
   e.g. `https://leadgen-production-abcd.up.railway.app`.
2. Set `NEXT_PUBLIC_SITE_URL` to exactly that URL.
3. **Redeploy** (rebuild) so the URL is baked in. Skipping this leaves canonicals pointing
   at localhost (demo mode) — the app still works, but SEO output is wrong.

## 5 · Persistent media volume

App service → **Settings → Volumes → Attach volume** → mount path **`/app/.media-store`**.
Without it, uploaded media disappears on every redeploy (the local-fs provider writes there).

> **If uploads fail with `EACCES` (permission denied):** the container runs as a non-root
> user (`nextjs`), and some platforms mount volumes root-owned. Fix on Railway by setting the
> service variable `RAILWAY_RUN_UID=0` (runs as root — acceptable for a test deployment), or
> switch media to the R2/S3 provider when you have bucket keys. Check the Deploy logs for the
> exact error before assuming this is the cause.

## 6 · Background worker (jobs won't run without this)

Queued jobs (AI generation, blog, deployments) only process when something POSTs the worker
endpoint. Two options:

**Option A — Railway cron service (recommended):**
1. **+ New** → **Empty Service** → name it `worker`.
2. Source: **Docker Image** → `curlimages/curl:8.10.1`.
3. Settings → **Cron Schedule**: `*/2 * * * *` (every 2 minutes).
4. Custom Start Command (uses the private network — no public egress):
   ```
   curl -s -X POST -H "Authorization: Bearer $JOBS_WORKER_TOKEN" http://app.railway.internal:3000/api/jobs/run
   ```
   (replace `app` with your app service's name; add `JOBS_WORKER_TOKEN` as a variable on
   this service too: `${{app.JOBS_WORKER_TOKEN}}`.)

**Option B — external pinger:** a free https://cron-job.org job POSTing
`https://<your-app>/api/jobs/run` with header `Authorization: Bearer <JOBS_WORKER_TOKEN>`
every 1–2 minutes. Simplest if the private-network route gives you trouble.

## 7 · Verify the deploy (5-minute smoke)

```bash
BASE=https://<your-app>.up.railway.app
curl -s $BASE/api/health/live            # → {"status":"ok"}
curl -s $BASE/api/health/ready           # → {"status":"ready", checks all true}
curl -s $BASE/robots.txt                 # → Host/Sitemap show YOUR domain (not localhost)
curl -s -o /dev/null -w "%{http_code}\n" $BASE/dashboard   # → 307 (redirects to /login)
curl -s -H "Authorization: Bearer $ADMIN_API_TOKEN" $BASE/api/health/metrics  # queue/user counts
```

Then in the browser: **register → verify the dashboard loads → create a website via the
wizard → AI Generator tab → Generate** → within ~2 min (one worker tick) the site flips to
GENERATED and the Builder shows the composed home page. That's the full loop.

## 8 · Ongoing

- **Logs/metrics:** Railway's Observability tab (7-day retention on Hobby).
- **Backups:** Railway PG has snapshots; for belt-and-braces run
  `pg_dump $DATABASE_URL -Fc -f backup.dump` before risky changes
  (restore drill documented in `docs/PHASE_11_DEPLOYMENT_UAT.md` §10).
- **Custom domain later:** add it in Networking, update `NEXT_PUBLIC_SITE_URL`, redeploy
  (rebuild), and connect the domain in-app via the Domains tab (DNS TXT verification works).
