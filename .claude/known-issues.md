# Known Issues, Limitations & Technical Debt

> Honest register of what's incomplete or fragile. Keep current — update when an item
> is fixed or a new one is found. Related: `PROJECT_HEALTH.md`, `.claude/tasks.md`.

## Limitations (by design at this stage)
- **Deterministic content by default.** AI copy requires a provider key; live-AI
  output **quality/cost unverified at scale**.
- **Single in-repo `BusinessConfig`** (`data/business.ts`) — no database/persistence;
  one business at a time. Multi-tenancy needs Auth + DB (T-020).
- **Image engine is prompts-only** — no generated image files; `public/` not created.
- **Website Builder renders at `/preview`**; production routes still use bespoke JSX
  (adopting `BlockRenderer` is Phase 7 / T-010).

## Technical debt
- **Per-instance state:** rate limiter (`lib/api/rate-limit.ts`) and AI cache
  (`lib/ai/cache`, file-backed) are per server instance — under-enforce/duplicate
  across multiple instances. Swap for a shared store (Redis/Upstash) before scale
  (T-032).
- **Testing depth (5/10):** pure-logic unit tests only; no component/integration/e2e
  or coverage (T-002). Highest-leverage debt.
- **Dependency ranges are `^`:** pin exact versions for a hardened release (T-033).
- **Ad-hoc logging:** `console.*` scattered; needs a `lib/logging/` abstraction (T-001).

## Known minor issues
- **Pre-existing unused local** `lib/generator/content.ts:220` (`config`) — only flagged
  under non-default `--noUnusedLocals`; not in the project's `type-check`; not a
  regression; non-blocking (T-034).

## Security gaps (baseline is solid — see `SECURITY.md`)
- No auth/RBAC/multi-tenant isolation yet.
- CSP/HSTS expected at the edge/proxy (not in app config).
- No secret-scanning in CI.

## Performance gaps
- No Lighthouse/Core Web Vitals audit; no bundle-size budget in CI; no real image
  assets yet (affects LCP once added).

## Watch-outs for future sessions
- Moving folders ripples through `@/*` aliases (incl. self-refs) — type-check immediately.
- Don't fork the single sources of truth (origin, config, cache freshness).
- Verify route/sitemap/JSON-LD invariants on any structural change.
- `v0.6.0` tag points to `02a7690` (Phase-6 commit), not `main`'s merge tip `cf1cff1`.
