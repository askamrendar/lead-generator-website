# Permanent Project Rules

> These are binding for every session. Precedence: explicit user instruction >
> these rules > defaults. When a rule and reality conflict, surface it — don't guess.

## Work integrity
1. **Never regenerate or rewrite completed, verified work.**
2. **Never overwrite architecture.** Extend it.
3. **Always extend documentation; never duplicate it.** Cross-link the canonical doc.
4. **Always preserve history.** Never delete docs, changelog entries, or ADRs.
5. **No placeholder code / empty scaffolding** for unbuilt modules — document them
   (`ARCHITECTURE.md` §2, `.claude/future-features.md`); create a folder only when
   real code lands.

## Build & quality
6. **Always keep the build green.** After every change run, in order:
   `npm run lint` → `npm run type-check` → `npm test` → `npm run build`.
   Never continue on a red gate.
7. **Preserve invariants:** routes, sitemap (66 URLs), JSON-LD (4 home blocks) stay
   identical unless the change is intentional and documented. Diff vs a snapshot.
8. **Single sources of truth:** site origin only via `lib/site.ts`; business config
   only `data/business.ts`; cache freshness only `lib/ai/cache/freshness.ts`.

## Git (see `.claude/git-workflow.md`)
9. **Never commit automatically.** 10. **Never push automatically.**
11. **Never create/modify tags automatically.** 12. **Never merge/force-push
    automatically.** 13. **Always ask before ANY git write operation** and report
    state first. Only proceed on an explicit instruction (e.g. "Commit and Push",
    "PUSH TO GITHUB").

## Documentation maintenance (automatic)
14. When a **phase/feature changes state**, update: `.claude/progress.md`,
    `.claude/tasks.md`, `.claude/roadmap.md`, `.claude/change-history.md`,
    `.claude/known-issues.md`, and (if affected) `PROJECT_MANIFEST.md`,
    `CHANGELOG.md`, `README.md`, `ROADMAP.md`.
15. When an **architectural decision** is made, add an ADR to `.claude/decisions.md`
    (and `docs/decision-log.md`).
16. Keep `.claude/context.md` current — it is the live snapshot.

## Scope discipline
17. Do exactly what's asked; if a task says "docs only", change **no code**.
18. Use **plan mode** for multi-file/architectural work; get approval before executing.
19. Confirm before hard-to-reverse or outward-facing actions.

## Verification honesty
20. Report outcomes faithfully — if a gate fails, say so with output; if a step was
    skipped, say that. Don't claim "done" without verifying.
