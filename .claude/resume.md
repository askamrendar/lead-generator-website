# Resume — read PROJECT_MEMORY.md first

**Every future Claude session: read [`PROJECT_MEMORY.md`](../PROJECT_MEMORY.md) (project
root) FIRST. It is the single source of truth.** Do not scan the repository; inspect only
source files needed for the requested task.

30-second orientation (authoritative detail in `PROJECT_MEMORY.md`):
- **Project:** Lead Generator Website — multi-tenant AI SaaS generating SEO local-business sites.
- **Working version:** v0.8.0-alpha (prepared, gates green **76/76**, **not yet published**).
- **GitHub production:** v0.6.0. **Branch:** `feature/phase-7-visual-builder`.
- **Done:** Phases 1–6 (v0.6.0) → 7.1 Auth/DB → 7.2.0 Tenant Access → 7.2.1 Auth UI →
  7.2.2 Dashboard → 7.2.3 Website Manager → dashboard redesign.
- **Next task:** publish v0.8.0-alpha, then Phase 7.2.4 (Visual Builder). See `PROJECT_MEMORY.md` §14.
- **Never change:** `@/*` alias · site origin (`lib/site.ts`) · cache-freshness predicate ·
  route/sitemap(66)/JSON-LD(4) invariants · tenant access via `lib/auth/access` · Builder edits pages only.

Open `PROJECT_MEMORY.md` for the full picture.
