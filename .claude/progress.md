# Progress — Completed & Current Milestones

> Status legend: ✅ Completed · 🔄 In Progress · ⏳ Pending · ⛔ Blocked.
> Canonical release detail: [`CHANGELOG.md`](../CHANGELOG.md). Roadmap:
> [`ROADMAP.md`](../ROADMAP.md). Update this file whenever a phase changes state.

## Timeline

| Phase | Milestone | Version | Status |
| --- | --- | --- | --- |
| Core | Generator Core | 0.1.0 | ✅ |
| SEO | Nationwide SEO Generator | 0.2.0 | ✅ |
| AI-1 | AI Content Engine | 0.3.0 | ✅ |
| AI-2 | AI Rendering Engine | 0.4.0 | ✅ |
| Builder | Website Builder (Template + Block Engine) | 0.5.0 | ✅ |
| Hardening | Production Hardening | 0.5.1 | ✅ |
| Restructure | Enterprise Restructure | 0.6.0 | ✅ |
| **7** | **Visual Builder** | 0.7 (planned) | 🔄 not started |

## ✅ Generator Core (0.1.0)
`BusinessConfig` Zod schema + selectors; home/about/contact; `/services/[slug]`;
`/locations/[state]/[city]`; `/generate` intake + `/api/generate`; deterministic
content engine; sitemap/robots/manifest; sample business (Apex Plumbing Co.).

## ✅ Nationwide SEO Generator (0.2.0)
Geo taxonomy (counties/ZIPs/neighborhoods, nearby selectors); service×city matrix
(ISR); internal link engine + `RelatedLinks`; expanded JSON-LD (serviceInCity,
Place/AdministrativeArea/PostalCodeArea, Speakable, ImageObject, Article); geo meta
+ hreflang. Sitemap grew 24 → 66 URLs.

## ✅ AI Content Engine (0.3.0)
Provider-agnostic (`openai`/`anthropic`/`gemini`/`openrouter`/`mock`), env-selected;
versioned prompt library; file+memory cache; content-service orchestrator with
retry/rate-limit + deterministic fallback; 18 agents; image-prompt + blog generators;
`/api/ai/generate`.

## ✅ AI Rendering Engine (0.4.0)
`resolvePageContent` (cache-first, read-only, never blocks); validation + repair;
cache metadata (status/businessVersion/ttl/hash); versioning + rollback; batch
generation + `scripts/pregenerate.mjs`; expanded `/api/ai/*`. All content pages wired.

## ✅ Website Builder (0.5.0)
8 themes + `ThemeProvider`; 22 blocks + `BlockRenderer`; 5 industry packs; 4 templates
(inheritance); `composePage`; heuristic + `aiSelectBuild`; registries; live `/preview`.

## ✅ Production Hardening (0.5.1)
Single-source site origin + build guard; `/api/lead` rate limiting + honeypot fix;
unified cache freshness (`isCacheEntryFresh`); consistent API error shape
(`serverError`); admin-gated cache read; `SECURITY.md`; env docs; first test suite
(17 `node --test` cases). Tag `v0.5.1`.

## ✅ Enterprise Restructure (0.6.0)
`themes/` + `industries/` promoted to repo root; `LeadForm`→`components/forms`,
`JsonLd`→`components/seo`; `ARCHITECTURE.md`, `docs/`, `.github/` (CI), `.ai/`;
future modules documented not scaffolded; routes/SEO verified byte-identical.
Release baseline merged to `main` (commit `cf1cff1`), `stable/v0.6.0` cut. Tag `v0.6.0`.

## 🔄 Phase 7 — Visual Builder (current, not started)
**Goal:** live editing surface over the block/theme engine + adopt `BlockRenderer`
on production routes. Objectives/risks/deliverables/success criteria:
[`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md) (Phase 7) and `.claude/roadmap.md`.
**Status:** branch `feature/phase-7-visual-builder` exists; no Phase 7 code yet.

## Pending / not started (documented, not scaffolded)
Blog pages · Media/Image engine · Auth & multi-tenancy · Dashboard · Billing ·
Deployment · Analytics · Logging · white-label/marketplace/plugins. See
`.claude/future-features.md`, `ARCHITECTURE.md` §2.

## ⛔ Blocked
Nothing hard-blocked. Note: all multi-tenant work (Dashboard/Admin/Billing/
Deployment/CRM persistence) depends on **Auth + a database** — the critical path.
