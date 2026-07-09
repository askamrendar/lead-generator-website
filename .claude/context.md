# Project Context — Live Snapshot

> The fastest "where are we" file. Keep this current; it is the second thing a
> session reads after `CLAUDE.md`. Canonical detail links are inline.

## At a glance (as of 2026-07-10)

| | |
| --- | --- |
| **Project** | Lead Generator Website — config-driven AI local-business site generator |
| **Version** | v0.6.0 (Enterprise Architecture Release) |
| **Repo** | github.com/askamrendar/lead-generator-website |
| **Current branch** | `feature/phase-7-visual-builder` |
| **Production branch** | `main` (at v0.6.0 baseline `cf1cff1`) |
| **Integration branch** | `develop` |
| **Stable branch** | `stable/v0.6.0` |
| **Release branch** | `release/v0.6.0` |
| **Current milestone** | Phase 7 — Visual Builder (not yet started) |
| **Build** | ✅ green — 83 routes, 17 tests, lint+type-check clean |
| **Health** | 8.0/10 (see `PROJECT_HEALTH.md`) |

## Business (full: `.claude/project.md`)
A SaaS that generates complete, SEO-optimized nationwide local-business websites
from one business-info form. Target users: local service businesses (plumbing,
HVAC, roofing, electrical, …) and agencies. Value: an entire block-driven, schema-
rich, lead-capturing site from a single config, with optional AI copy.

## Architecture (full: `ARCHITECTURE.md`, `.claude/architecture.md`)
Layered: routing → presentation → domain engines → content/rendering → platform →
config. `data/business.ts` is the root input. Zero circular deps. Single sources of
truth: site origin (`lib/site.ts`), business config (`data/business.ts`), cache
freshness (`lib/ai/cache/freshness.ts`).

## Current milestone — Phase 7 Visual Builder
Promote the proven block/theme engine into a live editing surface and adopt
`BlockRenderer` on production routes. **Not started.** Objectives, risks, deliverables,
success criteria: `NEXT_RELEASE_PLAN.md` (Phase 7) and `.claude/roadmap.md`.

## Known issues / debt (full: `.claude/known-issues.md`)
- Content deterministic by default; live-AI quality unverified at scale.
- Single in-repo `BusinessConfig` (no DB/persistence).
- Image engine prompts-only; `public/` not created.
- Rate-limit + AI cache are per server instance.
- Builder renders at `/preview`; production routes still use bespoke JSX.
- Testing covers pure logic only (weakest category, 5/10).
- Pre-existing unused local `lib/generator/content.ts:220` (non-blocking).

## Next task
Begin Phase 7 (Visual Builder) — OR pick a higher-value/no-infra item per
`NEXT_RELEASE_PLAN.md` recommended order (Logging → Blog → CRM → Media → Auth …).
Confirm intent with the user. Canonical "Next task": `PROJECT_MANIFEST.md`.

## Important decisions (full: `.claude/decisions.md`, `docs/decision-log.md`)
- Restructure existing code only; document (not scaffold) future modules.
- `themes/` + `industries/` are top-level domains.
- Keep `components/site/` and `lib/ai/cache/` in place.
- Single origin source; unified cache freshness.

## Never-change list
- `@/*` root alias (moving folders = global alias rewrite + self-refs).
- Site origin only via `lib/site.ts`.
- One cache-freshness predicate (`lib/ai/cache/freshness.ts`).
- Route/sitemap/JSON-LD invariants (verify byte-identical on structural changes).
- No auto commit/push/tag; no code changes during docs tasks.
