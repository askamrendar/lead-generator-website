# Change History — Living Project Log

> This file supplements **`PROJECT_MEMORY.md`** (canonical project memory — read first).
> History below is preserved (append-only).
>
> Chronological record of phases, releases, architectural changes, and tags.
> Newest at top. Canonical release notes: [`CHANGELOG.md`](../CHANGELOG.md); ADRs:
> `.claude/decisions.md` + [`docs/decision-log.md`](../docs/decision-log.md);
> session narrative: [`.ai/session-log.md`](../.ai/session-log.md).

## 2026-07-10 — Release Preparation & AI Operating System
- **Release prep (v0.6.0):** concluded the approved `release/v0.6.0` → `main` merge
  as the official baseline — merge commit **`cf1cff1`** *"Release: Prepare v0.6.0
  Production Baseline"* (parents `398e432` + `02a7690`). Created `stable/v0.6.0`.
  Added `PROJECT_HEALTH.md`, `NEXT_RELEASE_PLAN.md`, `docs/RELEASE_CHECKLIST.md`,
  `docs/RELEASE_NOTES_v0.6.0.md`. Local backup `LeadGeneratorWebsite-v0.6.0.zip`.
- **AI Operating System:** created `CLAUDE.md` + `.claude/*` knowledge base
  (this task) — documentation only, no code change.
- Branches now: `main`@v0.6.0, `develop`, `release/v0.6.0`, `stable/v0.6.0`,
  `feature/phase-7-visual-builder` (current).

## 2026-07-09 — v0.6.0 Enterprise Restructure (Phase 6)
- Promoted `themes/` + `industries/` to repo root; `LeadForm`→`components/forms`,
  `JsonLd`→`components/seo` (all via `git mv`, history preserved).
- Added root `ARCHITECTURE.md`, `docs/` deep dives + decision log, `.github/` CI +
  templates, `.ai/` working memory.
- Future modules documented, not scaffolded. Routes/sitemap verified byte-identical
  (66 URLs / 71 routes). Tag `v0.6.0` → `02a7690`.

## 2026-07-09 — v0.5.1 Production Hardening (Phase 5.5)
- Single-source site origin (`lib/site.ts`) + build guard; `/api/lead` rate limiting
  + honeypot fix; unified cache freshness (`lib/ai/cache/freshness.ts`); consistent
  API error handling (`serverError`); admin-gated `GET /api/ai/cache`; `SECURITY.md`;
  env docs; first test suite (17 cases). Tag `v0.5.1` → `398e432`.

## Earlier — Feature build-out (0.1.0 → 0.5.0)
- **0.5.0** Website Builder (8 themes, 22 blocks, 5 industries, 4 templates, `/preview`).
- **0.4.0** AI Rendering (cache-first render, versioning/rollback, pre-generation).
- **0.3.0** AI Content Engine (providers, prompts, cache, agents, `/api/ai/generate`).
- **0.2.0** Nationwide SEO (geo taxonomy, service×city matrix ISR, link engine, schema).
- **0.1.0** Generator Core (config schema, pages, intake, sitemap/robots/manifest).

## Tag ledger
| Tag | Commit | Meaning |
| --- | --- | --- |
| `v0.5.1` | `398e432` | Production Hardening |
| `v0.6.0` | `02a7690` (annotated obj `9ece85f`) | Enterprise Restructure |

## How to append here
On every phase/release/architectural change: add a dated entry (newest at top),
reference the commit/tag, and cross-link the canonical doc. Never rewrite past
entries — only add.
