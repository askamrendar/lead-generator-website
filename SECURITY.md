# Security

Production security posture for the Lead Generator Website. This documents the
controls that ship in the code and the operational steps required to run them
safely. It is referenced from `lib/api/rate-limit.ts`.

## API surface

| Route | Method | Auth | Rate-limit bucket |
| --- | --- | --- | --- |
| `/api/lead` | POST | public | `lead` (5 / min) |
| `/api/generate` | POST | public | `generate` (10 / min) |
| `/api/ai/status` | GET | public info | `ai-read` (60 / min) |
| `/api/ai/provider` | GET | public info | `ai-read` |
| `/api/ai/prompts` | GET | public info | `ai-read` |
| `/api/ai/generate` | GET | public info | `ai-read` |
| `/api/ai/cache` | GET | **admin** | `ai-read` |
| `/api/ai/generate` | POST | **admin** | `ai-write` (10 / min) |
| `/api/ai/regenerate` | POST | **admin** | `ai-write` |
| `/api/ai/batch` | POST | **admin** | `ai-write` |
| `/api/ai/cache` | DELETE / POST | **admin** | `ai-write` |

## Admin authentication

Mutating AI endpoints and the cache **listing** endpoint are gated by
`requireAdmin` (`lib/api/security.ts`), which:

- **Fails closed.** With `ADMIN_API_TOKEN` unset, the endpoint returns `503`
  (disabled) rather than being left open. Set `ADMIN_API_TOKEN` to enable them.
- Accepts the token via `Authorization: Bearer <token>` or `X-Admin-Token`.
- Compares in **constant time** (`node:crypto.timingSafeEqual`) to avoid timing
  side channels.

`/api/ai/cache` GET is admin-gated because it returns the full content registry
(page copy, provider, model, `businessVersion`). The other AI **read** endpoints
(`status`, `provider`, `prompts`, `generate` GET) expose only non-sensitive
engine metadata and remain public; gate them behind a proxy if you consider the
prompt library proprietary.

## Rate limiting

`lib/api/rate-limit.ts` is a precise **sliding-window** limiter, dependency-free.

- **Scope: per server instance.** Counters live in process memory. On
  serverless / multi-instance deployments each instance keeps its own counters,
  so the effective limit scales with instance count. Swap the in-memory `buckets`
  map for a shared store (Redis, Upstash) before relying on it as a hard global
  limit.
- Client identity is derived best-effort from `x-forwarded-for` →  `x-real-ip` →
  `cf-connecting-ip`. Ensure your proxy sets a trustworthy forwarding header;
  otherwise all traffic collapses to one `anonymous` bucket.
- All limits are env-tunable (`RATE_LIMIT_*`, see `.env.example`).
- `429` responses carry `Retry-After` and `X-RateLimit-*` headers.

## Lead intake

- Submissions are validated server-side with the shared `leadSchema`
  (`lib/forms/lead.ts`); invalid bodies return `422`.
- A **honeypot** field (`company`, hidden from users) is accepted by the schema
  so a bot that fills it passes validation and is then **silently dropped**
  (`{ ok: true }`) by the route — it is never rejected with an error that would
  reveal which field is the trap.
- Downstream delivery (the CRM/email/SMS integration seam) runs inside a
  `try/catch`; a provider outage degrades to `502` instead of leaking internals.

## Canonical origin

Every canonical URL, OG tag, sitemap entry, robots host, and JSON-LD `@id`
derives from `NEXT_PUBLIC_SITE_URL` (single source of truth: `lib/site.ts`).
Set it to your public https origin before deploying. A production build with a
localhost origin logs a warning; enforce a hard failure in CI by calling
`assertProductionSiteUrl(url, { strict: true })` or asserting the env var is set.

## Transport & headers

`next.config.mjs` sets `X-Content-Type-Options: nosniff`,
`X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`,
and disables the `X-Powered-By` header. Terminate TLS and add HSTS /
Content-Security-Policy at your edge/proxy for a complete posture.

## Reporting

This is a template project with no external services wired by default. When you
integrate a CRM, database, or auth provider, route secrets through environment
variables only (never commit `.env*.local`) and add a real disclosure contact
here.
