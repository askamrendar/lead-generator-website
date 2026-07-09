# Engineering Principles

> How we build. Pair with `.claude/coding-standards.md` (the concrete rules) and
> `PROJECT_HEALTH.md` (current scores + gaps).

## Core principles
- **Clean architecture / separation of concerns.** Dependencies flow downward
  (routing → presentation → domain → content → platform → config). Domain engines
  don't import routing; prompts never live in business logic.
- **SOLID.** Single responsibility per module; open/closed via **registries**
  (themes/industries/templates/blocks/agents add without editing consumers);
  dependency inversion via interfaces (`AIProvider`, `CacheStore`).
- **DRY / single source of truth.** One origin resolver, one config, one cache-
  freshness rule, one metadata builder, one prompt library.
- **Type safety.** Strict TypeScript; Zod validates all external input at the
  boundary (config, forms, API bodies) and infers types inward.
- **Determinism first.** A deterministic baseline always renders; AI is an optional
  overlay. Rendering is read-only and never blocks or incurs cost.

## Quality attributes (and where they live)
- **Modularity:** registries + `@/*` alias; small focused files.
- **Scalability:** geo taxonomy + ISR matrix scale to thousands of pages; known
  limit is single-instance state (rate-limit/cache) — swap for shared store at scale.
- **Maintainability:** documented, typed, conventional; zero circular deps.
- **Performance:** SSG/ISR; AVIF/WebP configured; render never calls providers.
  Gap: no Lighthouse/CWV audit or bundle budget yet.
- **Security:** headers, `poweredByHeader:false`, admin API fails closed +
  constant-time compare, honeypot + rate limiting, non-leaking error shape,
  env-only secrets. See `SECURITY.md`. Gaps: no auth/RBAC, edge CSP/HSTS pending.
- **SEO:** per-page metadata + canonical + full JSON-LD from one origin; sitemap/
  robots; geo meta + hreflang. Treated as an **invariant** — verify on changes.
- **Accessibility:** semantic HTML/a11y baseline; gap: no automated a11y test.
- **Testing philosophy:** test pure logic deterministically (validators, limiter,
  freshness, URL) with zero deps (`node --test`); expand to component/route/integration
  as surfaces grow. Testing is the top quality investment (see `PROJECT_HEALTH.md`).

## Decision rules of thumb
- Prefer **moving over rewriting**; prefer **extending a registry** over branching logic.
- Prefer **additive, one-file** changes (a theme/industry/template/block = one file
  + one registry entry).
- If a change touches routes/SEO, **prove the invariant** (diff sitemap + routes).
- If it introduces cross-cutting state, ask: does it work on N instances? If not,
  document the limit and plan a shared store.
