# `.ai/` — Agent Working Memory

Lightweight, human-readable context for AI/agent sessions. This folder is
**complementary** to the canonical docs, not a copy of them — single source of
truth is preserved:

| File | Purpose | Canonical source |
| --- | --- | --- |
| `state.md` | Pointer to current build/task state | `../PROJECT_MANIFEST.md` |
| `session-log.md` | Chronological summary of what each session did | (this folder) |
| `checkpoints.md` | Verified-green checkpoints (gate results per milestone) | (this folder) |
| `ai-memory.md` | Durable, non-obvious notes for future sessions | (this folder) |

Rules:
- Do **not** duplicate the manifest/roadmap/changelog here — link to them.
- Append to `session-log.md` and `checkpoints.md`; don't rewrite history.
- Keep entries short and factual. Record the *why*, not diffs.
