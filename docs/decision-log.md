# Architecture Decision Log

Short, dated ADRs. Newest first. Record the decision and the *why*, not a diff.

## ADR-0004 — Restructure existing code only; document future modules (Phase 6, 2026-07-09)
**Decision:** Reorganize implemented code into the enterprise layout and
**document** (not scaffold) unbuilt modules. No empty folders or stub code.
**Why:** The repo must represent the implemented system. Empty scaffolding is
technical debt and misrepresents readiness. Every directory should hold
meaningful, maintained code; a module's folder is created when its phase ships.
**Consequences:** Future modules (Auth, Billing, CRM, Dashboard, Admin, Blog,
Deployment, Media, Analytics, Logging) live in `ARCHITECTURE.md` + `ROADMAP.md` +
`PROJECT_MANIFEST.md` until built.

## ADR-0003 — Promote `themes/` and `industries/` to repo root (Phase 6, 2026-07-09)
**Decision:** Move `lib/builder/themes` → `themes/` and
`lib/builder/industries` → `industries/`; keep `lib/builder/types.ts` as the
shared contract.
**Why:** They are first-class, reusable domains (the target lists them
top-level), not internals of the builder. Blast radius was small (7 + 5 refs).
**Consequences:** Imported via `@/themes` / `@/industries`. Verified
routes/sitemap byte-identical.

## ADR-0002 — Keep `components/site/` and `lib/ai/cache/` in place (Phase 6, 2026-07-09)
**Decision:** Do not rename `components/site/` (→ `sections/`) or extract
`lib/ai/cache/` to a generic `lib/cache/`.
**Why:** `components/site` has 92 referencing imports and the rename adds no
functional value ("only move when necessary"). `lib/ai/cache` stores
`GeneratedPageContent` and is tightly coupled to AI; a generic cache is
introduced only if a non-AI need appears. Only `LeadForm` (→ `components/forms`)
and `JsonLd` (→ `components/seo`) moved, where the new home is clearly correct.
**Consequences:** `app/` routing left untouched for maximum SEO/route safety; a
`(marketing)` route group remains an optional future refinement.

## ADR-0001 — Unify cache freshness; site-URL single source of truth (Phase 5.5)
**Decision:** One `isCacheEntryFresh()` used by both render and content-service;
`siteUrl` derives from `resolveSiteUrl()` with a build-time guard.
**Why:** The two cache readers diverged (stale content served on one path); the
canonical origin was hardcoded to localhost. See `CHANGELOG.md` `[0.5.1]`.
