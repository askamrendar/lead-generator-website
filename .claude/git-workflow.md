# Git Workflow

> **Golden rule:** never perform a git write (commit/push/tag/merge/branch/reset)
> without explicit user approval. Report state first, then wait. See `.claude/rules.md`.

## Branch strategy
| Branch | Role |
| --- | --- |
| `main` | Production baseline. Protected. Tagged releases. Currently at v0.6.0 (`cf1cff1`). |
| `develop` | Integration branch for accumulating features. |
| `release/vX.Y` | Release stabilization; merged to `main` at release. |
| `stable/vX.Y` | Immutable snapshot of a shipped release (e.g. `stable/v0.6.0`). |
| `feature/*` | One feature/phase (current: `feature/phase-7-visual-builder`). |
| `hotfix/*` | Urgent fix off `main`; back-merge to `develop`. |

## Feature flow
```
feature/phase-N-…  →  develop  →  release/vX.Y  →  main  (tag vX.Y)  →  stable/vX.Y
```
1. Branch `feature/*` off `develop`. 2. Build + keep green. 3. PR → `develop`.
4. Cut `release/vX.Y` from `develop` when scope is ready; stabilize.
5. Merge `release` → `main`, tag, cut `stable/vX.Y`.

## Hotfix flow
`hotfix/*` off `main` → fix + verify → merge to `main` (tag patch) → back-merge to
`develop` (and any active `release/*`).

## Commit messages
- Imperative subject; scope-clear. Body explains the *why* + verification.
- Release/baseline commits use the message the user specifies verbatim.
- End messages with the co-author trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

## Tag strategy
- Annotated tags `vMAJOR.MINOR[.PATCH]` on the release commit. Existing: `v0.5.1`,
  `v0.6.0`. **Never modify or move an existing tag.** Never create a tag without approval.

## Merge strategy
- Prefer PR merges into `develop`/`main`. Merge commits are fine for release
  integration. Resolve conflicts explicitly; verify green before concluding a merge.
- **Never** conclude an in-progress merge without confirming intent (a mid-merge tree
  can be surprising — report `HEAD`, `MERGE_HEAD`, `MERGE_MSG` and ask).

## Recovery
- Undo a local unpushed commit: `git reset --soft HEAD~1` (keep changes) — only with
  approval. Abort a merge: `git merge --abort`. Never `push --force` to shared branches.
- Backups: a verified `LeadGeneratorWebsite-vX.Y.zip` is produced at release (source
  only, heavy dirs excluded) and stored beside the repo.

## Repository protection (maintainer, GitHub UI)
- Protect `main` (and `stable/*`): require CI (`.github/workflows/ci.yml`) + review,
  disallow force-push/deletion. Track in `docs/RELEASE_CHECKLIST.md`.

## GitHub workflow
- Remote: `origin` → github.com/askamrendar/lead-generator-website. CI runs
  lint → type-check → test → build on push/PR. Do not open PRs/releases without approval.
