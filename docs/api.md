# API Layer (`app/api/`, `lib/api/`)

All routes run on the `nodejs` runtime, validate input with Zod, guard
`request.json()`, and return a consistent `{ error }` shape. Full posture in
[`../SECURITY.md`](../SECURITY.md).

## Routes

| Route | Method | Auth | Rate bucket |
| --- | --- | --- | --- |
| `/api/lead` | POST | public | `lead` (5/min) |
| `/api/generate` | POST | public | `generate` (10/min) |
| `/api/ai/status` `/provider` `/prompts` `/generate` | GET | public info | `ai-read` (60/min) |
| `/api/ai/cache` | GET | **admin** | `ai-read` |
| `/api/ai/generate` `/regenerate` `/batch` | POST | **admin** | `ai-write` (10/min) |
| `/api/ai/cache` | DELETE / POST | **admin** | `ai-write` |

## `lib/api/`

- `security.ts` — `requireAdmin` (fails closed without `ADMIN_API_TOKEN`,
  constant-time token compare), `enforceRateLimit`, and `serverError` (uniform
  500 that logs server-side and never leaks internals).
- `rate-limit.ts` — dependency-free sliding-window limiter, per server instance,
  env-tunable via `RATE_LIMIT_*`. Swap for a shared store (Redis/Upstash) behind
  multiple instances.

## Conventions for new routes

1. `export const runtime = 'nodejs'`.
2. `enforceRateLimit(...)` first; `requireAdmin(...)` for mutating/admin reads.
3. Guard `request.json()` → 400 on parse failure.
4. Validate with Zod → 422 with `error.flatten()`.
5. Wrap core logic in `try/catch` → `serverError(context, err)`.
