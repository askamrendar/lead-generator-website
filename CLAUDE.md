# CLAUDE.md — AI Operating System Entry Point

> **This is the first file every Claude Code session should read.** It is the map
> to the whole project. Deep detail lives in the linked canonical docs — this file
> orients you fast, then points you there.

## 30-second resume

1. Read this file, then `.claude/context.md` (the live snapshot).
2. For the full session bootstrap, follow `.claude/session-template.md`.
3. Canonical state: **`PROJECT_MANIFEST.md`** (build status, current/next task).
4. **Never** commit, push, or tag without explicit user approval. **Never** change
   code during a docs/knowledge task. **Never** regenerate completed work.

## Project overview

**Lead Generator Website** — an AI-ready SaaS foundation that turns a single typed
`BusinessConfig` into a complete, SEO-optimized, nationwide local-business website
(homepage, services, locations, blog-ready, lead capture, full structured data).
Config-driven, provider-agnostic, offline-safe. Built to become a multi-tenant SaaS.

- **Repository:** https://github.com/askamrendar/lead-generator-website
- **Current version:** v0.6.0 (Enterprise Architecture Release)
- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind 3 · Zod · Node 22
- **No database yet** — deterministic content is the offline baseline; AI is optional.

## Architecture (summary — full detail in `ARCHITECTURE.md` + `.claude/architecture.md`)

Layered, domain-oriented, zero circular deps, single sources of truth:

```
Routing (app/) → Presentation (components/) → Domain engines (lib/builder, lib/seo,
lib/generator + themes/, industries/, templates/) → Content/Rendering (lib/ai)
→ Platform (lib/api, lib/site.ts) → Config (data/business.ts)
```

## Folder structure (top level)

```
app/  components/  lib/  themes/  industries/  templates/  data/
scripts/  tests/  docs/  .github/  .ai/  .claude/
```

Full folder explanations: `ARCHITECTURE.md` §1.2 and `.claude/architecture.md`.

## Milestones

- **Completed:** Generator Core → Nationwide SEO → AI Content Engine → AI Rendering
  → Website Builder → Production Hardening (v0.5.1) → Enterprise Restructure (v0.6.0).
- **Current:** **Phase 7 — Visual Builder** (branch `feature/phase-7-visual-builder`; not yet started).
- **Next:** see `.claude/roadmap.md` / `NEXT_RELEASE_PLAN.md`.

Detail: `.claude/progress.md`, `CHANGELOG.md`.

## Important files

| File | Why it matters |
| --- | --- |
| `data/business.ts` | The single `BusinessConfig` — root input for the whole site |
| `lib/generator/schema.ts` | Zod `BusinessConfig` (single source of truth for shape) |
| `lib/site.ts` | Canonical site origin (`resolveSiteUrl`) + build guard |
| `lib/ai/render.ts` | Cache-first, read-only page content resolver |
| `lib/ai/cache/freshness.ts` | The ONE cache-freshness rule (render + generate share it) |
| `lib/builder/` + `themes/` + `industries/` + `templates/` | Website Builder engine |
| `lib/seo/` + `components/seo/JsonLd.tsx` | Metadata + JSON-LD |
| `lib/api/security.ts` | Admin auth, rate-limit enforce, `serverError` |

## How Claude should work here

- **Read before writing.** Start with this file → `.claude/context.md` → the doc for
  your task area. Verify any file/flag still exists before relying on it.
- **Plan big changes.** Use plan mode for multi-file/architectural work; get approval.
- **Keep the build green** after every change: `lint` → `type-check` → `test` → `build`.
- **Preserve invariants:** routes, sitemap (66 URLs), and JSON-LD must stay identical
  unless a change is intentional and documented.

## Rules (full list: `.claude/rules.md`)

- **Coding:** strict TS, `@/*` root alias, DRY, SOLID, prompts never in business logic,
  single sources of truth (site origin, business config, cache freshness).
- **Git:** never commit/push/tag/merge without explicit approval. Feature → develop →
  release → main; `stable/*` snapshots. See `.claude/git-workflow.md`.
- **Docs:** never duplicate — extend and cross-link. Never delete history. Update
  `progress.md`, `tasks.md`, `change-history.md`, `PROJECT_MANIFEST.md`, `CHANGELOG.md`
  when a phase changes. See "Automatic maintenance" in `.claude/rules.md`.
- **Testing:** zero-dependency `node --test`; keep pure-logic focus; add coverage as
  new surfaces land. See `.claude/testing.md`.
- **Release:** follow `docs/RELEASE_CHECKLIST.md` + `.claude/release-process.md`.
- **Prompts:** reuse the library in `.claude/prompts.md`.

## Never-do list

- ❌ Regenerate or rewrite completed, verified work.
- ❌ Overwrite architecture or delete documentation/history.
- ❌ Scaffold empty folders / stub code for unbuilt modules (document them instead).
- ❌ Commit, push, tag, merge, or force-push without explicit user approval.
- ❌ Read the site origin from env anywhere except `lib/site.ts`.
- ❌ Add a second cache-freshness check (extend `lib/ai/cache/freshness.ts`).
- ❌ Leave the build red.

## Quick resume instructions

```
1. Read: CLAUDE.md → .claude/context.md → PROJECT_MANIFEST.md
2. Check: git branch, git status (report; don't mutate)
3. Verify green: npm run lint && npm run type-check && npm test && npm run build
4. Pick up the "Next task" from PROJECT_MANIFEST.md / .claude/tasks.md
5. Work in plan mode for anything non-trivial; keep the build green; update docs.
```
