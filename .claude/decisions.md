# Architecture Decision Records (index)

> Canonical ADR text: [`docs/decision-log.md`](../docs/decision-log.md). This is the
> **register** — a one-line index plus decisions made outside that file. Add new
> ADRs to *both* (short here, full there). Never rewrite a past ADR; only append.

## Register

| ADR | Decision | Where |
| --- | --- | --- |
| 0001 | Unify cache freshness; site-URL single source of truth (v0.5.1) | docs/decision-log.md |
| 0002 | Keep `components/site/` and `lib/ai/cache/` in place (v0.6.0) | docs/decision-log.md |
| 0003 | Promote `themes/` + `industries/` to repo root (v0.6.0) | docs/decision-log.md |
| 0004 | Restructure existing code only; document (not scaffold) future modules | docs/decision-log.md |
| 0005 | Conclude release/v0.6.0 → main as a merge commit for the v0.6.0 baseline | here |
| 0006 | Add a `.claude/` AI Operating System (docs-only knowledge base) | here |

## ADR-0005 — v0.6.0 baseline via merge commit (2026-07-10)
- **Decision:** conclude the in-progress `release/v0.6.0` → `main` merge as the
  official baseline (merge commit `cf1cff1`, message "Release: Prepare v0.6.0
  Production Baseline"), then cut `stable/v0.6.0` from `main`.
- **Why:** the merge was set up intentionally to bring Phase 6 to `main`; a merge
  commit preserves both parents (v0.5.1 + Phase 6) and full history.
- **Alternatives:** abort + fast-forward/cherry-pick (not available — branches had
  diverged, hence conflicts); linear squash (loses the two-parent provenance).
- **Trade-offs:** `main` now has a merge commit (2 parents); the `v0.6.0` tag stays
  on the Phase-6 commit `02a7690`, not the merge tip (tags are never moved). Accepted.

## ADR-0006 — `.claude/` AI Operating System (2026-07-10)
- **Decision:** add `CLAUDE.md` + `.claude/*` as a session-facing knowledge base that
  **cross-references** canonical root docs rather than duplicating them.
- **Why:** let any future session resume instantly without re-explanation; centralize
  rules/workflow/standards; keep single sources of truth intact.
- **Alternatives:** put everything in root docs (already large; mixes human + agent
  audiences); rely on session memory (not persistent/shared).
- **Trade-offs:** more files to keep current — mitigated by "extend, don't duplicate"
  and the automatic-maintenance rule (`.claude/rules.md` §14).

## How to add an ADR
Append a short row here + a full block in `docs/decision-log.md`: **Decision**,
**Why**, **Alternatives**, **Trade-offs/Consequences**, dated. Record the *reasoning*,
not a diff.
