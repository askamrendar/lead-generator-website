# Master Project Checklist

> One place to find the right checklist. Detailed lists live in the linked files;
> this is the index + the universal per-change list.

## Every change (universal)
- [ ] Read `CLAUDE.md` → `.claude/context.md` → the doc for the area.
- [ ] Plan mode for anything non-trivial; get approval.
- [ ] Make the change (match surrounding style; single sources of truth intact).
- [ ] `npm run lint && npm run type-check && npm test && npm run build` — all green.
- [ ] Invariants held (routes/sitemap/JSON-LD) or change intentional + documented.
- [ ] Update docs: `.claude/progress.md`, `.claude/tasks.md`, `.claude/change-history.md`,
      and `PROJECT_MANIFEST.md`/`CHANGELOG.md`/`README.md`/`ROADMAP.md` if affected.
- [ ] No git write without explicit approval.

## Milestone / phase completion
- [ ] Feature works end-to-end; tests added; gates green.
- [ ] `.claude/progress.md` status updated; `.claude/roadmap.md` reflects reality.
- [ ] New/changed decisions recorded (`.claude/decisions.md` + `docs/decision-log.md`).
- [ ] Known issues/debt updated (`.claude/known-issues.md`).
- [ ] `CHANGELOG.md` dated entry; `PROJECT_MANIFEST.md` "current/next task" updated.
- [ ] `.ai/session-log.md` + `.ai/checkpoints.md` appended.

## Release → see `docs/RELEASE_CHECKLIST.md` + `.claude/release-process.md`
- [ ] Gates green · artifacts present · invariants held · docs current.
- [ ] Backup zip verified · release notes drafted.
- [ ] (Approval) merge → main · tag · `stable/vX.Y` · push · GitHub Release · branch protection.

## QA → see `.claude/qa.md`
- [ ] Run the relevant subsystem list (Builder / SEO / Routing / Rendering / AI /
      Schema / A11y / Performance / API-security / Deployment).

## Testing → see `.claude/testing.md`
- [ ] Pure-logic unit tests for new engines/validators.
- [ ] Render/route smoke test for new page types (metadata + JSON-LD present).
- [ ] API error paths (400/422/429/502) + happy path.

## New module (unbuilt → built)
- [ ] Confirm target folder + phase in `ARCHITECTURE.md` / `.claude/future-features.md`.
- [ ] Create folder **with real code**; wire via registry/route; add tests.
- [ ] Move from planned → implemented across the doc set.
