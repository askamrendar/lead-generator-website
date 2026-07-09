# Session Template — Start Here Every Time

> Copy this flow at the start of a session. It bootstraps full project context in a
> few minutes and prevents re-explaining anything.

## 1. Read (in order)
1. `CLAUDE.md` — entry point + rules.
2. `.claude/context.md` — live snapshot (branch, milestone, next task, never-change).
3. `PROJECT_MANIFEST.md` — canonical build status + current/next task.
4. Then, for your task area, the relevant one of:
   `.claude/architecture.md` · `.claude/tasks.md` · `.claude/roadmap.md` ·
   `.claude/coding-standards.md` · `.claude/git-workflow.md` · `.claude/testing.md`.

## 2. Orient (report, don't mutate)
```bash
git branch --show-current
git status
git log --oneline -5
```

## 3. Verify green baseline
```bash
npm run lint && npm run type-check && npm test && npm run build
```
If red before you start: report it; treat fixing it as the first task (with approval).

## 4. Pick up work
- Take the "Next task" from `PROJECT_MANIFEST.md` / `.claude/tasks.md`.
- Non-trivial? Enter **plan mode**, explore, present a plan, get approval.

## 5. Execute
- Follow `.claude/coding-standards.md` + `.claude/rules.md`.
- Keep the build green after each step; preserve route/SEO invariants.
- No git write, no code change outside scope, without approval.

## 6. Close the session
- Update: `.claude/progress.md`, `.claude/tasks.md`, `.claude/change-history.md`,
  `.claude/context.md`, and `PROJECT_MANIFEST.md`/`CHANGELOG.md` if affected.
- Append `.ai/session-log.md` (what changed) + `.ai/checkpoints.md` (gate results).
- Record any decision in `.claude/decisions.md` (+ `docs/decision-log.md`).
- Report: what changed, what was verified, what's next. Wait for git approval.

## Golden reminders
- Extend docs, never duplicate. Preserve history.
- Single sources of truth: origin (`lib/site.ts`), config (`data/business.ts`),
  cache freshness (`lib/ai/cache/freshness.ts`).
- Never commit/push/tag/merge automatically.
