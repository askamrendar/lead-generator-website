# Token Guide — reading order

There is exactly ONE canonical memory file. Work with the fewest tokens:

## Reading order
1. **`PROJECT_MEMORY.md`** (project root) — always. Single source of truth.
2. **Only the source files required for the requested task.**
3. **Nothing else.**

## Rules
- Never scan the whole repository.
- Never reread documentation already summarized in `PROJECT_MEMORY.md`.
- Other `.claude/*` files are lightweight references — open one ONLY for its unique
  content (e.g. `rules.md`, `git-workflow.md`, `testing.md`). They do not repeat history.
- Reuse existing modules/components; never duplicate code or memory.
- After finishing a milestone or changing the version, **update `PROJECT_MEMORY.md`** (append
  to its Release / Milestone / Session logs — never delete prior entries).
