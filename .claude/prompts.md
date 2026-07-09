# Prompt Library

> Reusable, project-tuned prompts for common tasks. Copy/paste and fill the `<…>`.
> All assume the session has read `CLAUDE.md` + `.claude/context.md`. Every prompt
> implies the standing rules: keep the build green, no git writes without approval,
> extend docs, preserve invariants.

## Prompt-writing standards
- State the **goal**, the **scope/constraints**, and the **done criteria**.
- Name the **canonical files** to read first; forbid regenerating completed work.
- Require **verification** (lint/type-check/test/build + invariant diff).
- Require **doc updates** on completion. Ask for a **plan first** on big changes.

---

## Architecture
> "Explain/extend the architecture for `<subsystem>`. Read `ARCHITECTURE.md` +
> `.claude/architecture.md` first. Do not restructure. Produce a plan that names the
> exact files, preserves single sources of truth and zero circular deps, and keeps
> route/SEO invariants. No code until I approve."

## Builder
> "Add a `<block|theme|industry|template>` named `<x>`. One additive file + one
> registry entry (`lib/builder/blocks/registry` | `themes/registry` |
> `industries/registry` | `templates/registry`). Verify it renders at `/preview`.
> Gates green. Update `.claude/progress.md` if it's a milestone."

## SEO
> "Change `<metadata|JSON-LD|sitemap>` for `<page type>`. Use `lib/seo/*` +
> `components/seo/JsonLd.tsx`; origin only via `lib/site.ts`. Prove the sitemap URL
> set + route table are byte-identical unless the change is intended. Validate schema."

## Content
> "Improve deterministic/AI copy for `<page type>` in `lib/generator/content.ts` /
> `lib/ai/prompts/`. Keep per-page uniqueness. Prompts live only in `lib/ai/prompts`
> (bump `PROMPT_LIBRARY_VERSION` if templates change). Deterministic fallback must
> still render offline."

## Generator
> "Extend the generator for `<geo/service dimension>` in `lib/generator/{config,
> content,links,schema}.ts`. Update `generateStaticParams`, sitemap, and internal
> links consistently. Verify route/sitemap deltas are intended and documented."

## Release
> "Prepare release `v<x.y>`. Follow `.claude/release-process.md` + `docs/RELEASE_
> CHECKLIST.md`: gates green, artifacts present, invariants held, docs current,
> backup zip verified, notes drafted. Stage/commit only if I say so. No push/tag
> without explicit approval."

## QA
> "Run the `<subsystem>` QA list in `.claude/qa.md` against the current build.
> Report pass/fail per item with evidence. Don't fix silently — list findings first."

## Audit
> "Audit `<area>` for `<broken imports|circular deps|dead code|SEO regressions|
> security>`. Read-only; report findings with file:line ranked by impact. Then run
> lint/type-check/test/build and diff route/sitemap vs snapshot."

## Refactor
> "Refactor `<x>` for `<clarity/reuse>` with **no behavior change**. Prefer moving
> over rewriting; update all `@/*` aliases incl. self-refs; type-check immediately.
> Prove invariants unchanged. Plan first."

## Testing
> "Add tests for `<module>` per `.claude/testing.md`. Pure logic → `node --test`;
> new page type → render/route smoke (metadata + JSON-LD); API → 400/422/429/502 +
> happy path. Wire into CI. Keep zero-dependency unless we agree to a framework
> (record in `.claude/decisions.md`)."

## Git
> "Report `git branch`, `git status`, `git log --oneline -5`. Then `<intended git
> action>`. Do NOT execute any git write until I explicitly approve. Follow
> `.claude/git-workflow.md` (feature→develop→release→main; never move tags)."

## Documentation
> "Update docs for `<change>`. Extend, don't duplicate; cross-link canonical sources.
> Touch: `.claude/progress.md`, `.claude/tasks.md`, `.claude/change-history.md`, and
> `PROJECT_MANIFEST.md`/`CHANGELOG.md`/`README.md`/`ROADMAP.md` if affected. Preserve history."

## Future feature (start a planned module)
> "Begin `<module>` from `.claude/future-features.md` (phase `<Px>`). Confirm deps are
> met (e.g. Auth+DB). Create the folder **with real code** + tests; wire via
> registry/route. Move it planned→implemented across the doc set. Plan first."
