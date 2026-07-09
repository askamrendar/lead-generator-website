# v0.6.0 — Enterprise Architecture Release

> **Draft — not published.** Prepared for the GitHub Release; publish only on
> explicit maintainer approval. Target tag: `v0.6.0` (`02a7690`).

The Lead Generator Website reaches its first **enterprise-grade baseline**: a
config-driven, SEO-optimized, AI-renderable, block-composed website generator with
a clean, documented architecture — production-hardened and build-verified.

## Completed phases

- **Generator Core** — `BusinessConfig` (Zod) → homepage, service, location,
  about, contact, lead capture, sitemap/robots/manifest. Deterministic, offline.
- **Nationwide SEO** — geo taxonomy (states/cities/counties/ZIPs/neighborhoods),
  service×city matrix (ISR), internal link engine, full JSON-LD suite, geo meta +
  hreflang.
- **AI Content Engine** — provider-agnostic (OpenAI/Anthropic/Gemini/OpenRouter +
  mock), versioned prompt library, 18 agents, file+memory cache, retry/rate-limit,
  deterministic fallback.
- **AI Rendering** — cache-first, read-only `resolvePageContent` that never blocks
  or incurs cost at render; validate + repair; versioning + rollback; pre-generation.
- **Website Builder** — 8 themes, 22 blocks, 5 industries, 4 templates; JSON/block
  page composition; heuristic + AI build selection; live `/preview`.
- **Production Hardening (v0.5.1)** — single-source site origin + build guard,
  lead-endpoint rate limiting + honeypot fix, unified cache freshness, consistent
  API error handling, admin-gated cache read, `SECURITY.md`, first test suite.
- **Enterprise Restructure (v0.6.0)** — `themes/` + `industries/` promoted to root,
  `components/{forms,seo}`, `ARCHITECTURE.md`, `docs/`, `.github/` (CI), `.ai/`;
  future modules documented, not scaffolded; routes/SEO verified byte-identical.

## Statistics

| Metric | Value |
| --- | --- |
| Routes | **83** total (71 prerendered static/SSG) |
| Sitemap | 66 URLs · robots.txt present |
| JSON-LD | 4 schema blocks/page (WebSite, Organization, LocalBusiness, FAQPage, …) |
| Tests | **17/17** passing (`node --test`, zero deps) |
| Build | ✅ `next build` clean · TypeScript strict · ESLint clean |
| Architecture | layered/domain; **0 circular deps**; single sources of truth |
| Themes / Blocks / Industries / Templates | 8 / 22 / 5 / 4 |
| Health score | **8.0 / 10** (see `PROJECT_HEALTH.md`) |

## Known limitations

- Default content is deterministic; live-AI output quality unverified at scale.
- Single in-repo `BusinessConfig` (no database/persistence yet).
- Image engine is prompts-only (no generated assets); `public/` not yet created.
- Rate limiting + AI cache are per server instance (need shared store at scale).
- Website Builder renders at `/preview`; production routes still use bespoke JSX.
- Testing covers pure logic only (no component/integration/e2e yet).

## Next milestone

Recommended order: **Logging → Blog pages → CRM/lead delivery → Media → Auth →
Visual Builder / Dashboard → Billing → Deployment → Analytics.** Full detail in
[`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md) and [`ROADMAP.md`](../ROADMAP.md).

## Verify

```bash
npm ci
npm run lint && npm run type-check && npm test && npm run build
```
