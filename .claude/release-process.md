# Release Process

> Operational playbook. The authoritative gate list is
> [`docs/RELEASE_CHECKLIST.md`](../docs/RELEASE_CHECKLIST.md); a shipped example is
> [`docs/RELEASE_NOTES_v0.6.0.md`](../docs/RELEASE_NOTES_v0.6.0.md).

## Versioning
- SemVer `MAJOR.MINOR.PATCH`. Pre-1.0: MINOR = milestone (0.5 Builder, 0.6
  Restructure, 0.7 Visual Builder…), PATCH = hardening (0.5.1). 1.0 = monetized SaaS.

## Release checklist (summary — full in `docs/RELEASE_CHECKLIST.md`)
1. **Quality gates green:** lint · type-check · test (17/17) · build (83 routes).
2. **Artifacts:** sitemap (66 URLs), robots, metadata, JSON-LD (4 home blocks) present.
3. **Invariants:** routes/sitemap byte-identical vs baseline (unless intended).
4. **Docs current:** README, PROJECT_MANIFEST, ROADMAP, CHANGELOG (dated `[x.y.z]`),
   ARCHITECTURE, SECURITY, PROJECT_HEALTH, NEXT_RELEASE_PLAN.
5. **Backup:** `LeadGeneratorWebsite-vX.Y.zip` beside repo, `unzip -t` verified.
6. **Release notes** drafted (`docs/RELEASE_NOTES_vX.Y.md`) — completed phases, stats,
   known limitations, next milestone.

## Tag & branch (only on explicit approval)
7. Merge `release/vX.Y` → `main`; annotated tag `vX.Y` on the release commit.
8. Cut `stable/vX.Y` from `main` **after** the merge concludes.
9. Never modify existing tags; never push without "PUSH TO GITHUB".

## Publish (maintainer-gated)
10. GitHub Release from the drafted notes — **prepared, not published** by Claude.
11. Enable branch protection on `main`.

## Verification order (run before AND after)
```
npm run lint && npm run type-check && npm test && npm run build
```
Then diff sitemap URL set + prerendered route table against a pre-change snapshot.

## Rollback / recovery
- Local unpushed release commit wrong? `git reset` (with approval) or `git merge
  --abort` if mid-merge. Verified backup zip is the disaster fallback.
- Bad published release: revert the merge on `main` (new commit), patch, re-release
  as `vX.Y.Z+1`. Never rewrite public history or move tags.

## Claude's boundaries during a release
- Prepare everything (docs, notes, backup, staged changes) and **stop before any
  git write**. Show commit hash / `git status` / `git log --graph` after an approved
  commit. Push / publish / tag only on explicit instruction.
