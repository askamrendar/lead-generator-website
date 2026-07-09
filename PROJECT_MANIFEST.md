# Project Manifest — Lead Generator Website

> Update this file at the end of every coding session so the next session resumes cleanly.

## Build status
- **Last action:** Phase 6 — Restructuring & Engineering Standards. Reorganized
  **implemented** code into the enterprise layout and **documented** (did not
  scaffold) future modules. Moves via `git mv` (history preserved):
  `lib/builder/themes`→`themes/`, `lib/builder/industries`→`industries/`,
  `components/JsonLd.tsx`→`components/seo/`, `components/site/LeadForm.tsx`→
  `components/forms/`. Added `docs/`, `.github/` (CI + templates), `.ai/`, and
  root `ARCHITECTURE.md`. No behavior change.
- **Build verified?** ✅ Yes (Node v22.22.3 / Next.js 15.5.20):
  - `npm run lint` / `npm run type-check` / `npm test` (17/17) / `npm run build`
    → all clean; **83 routes**. Sitemap (66 URLs) + prerendered route table (71)
    verified **byte-identical** to the pre-restructure baseline (SEO preserved).
- **Restructure is behavior-preserving** — no routes, SEO, AI rendering, or tests
  changed; only file locations + import aliases + documentation.
- **Re-verify commands:**
  ```bash
  npm install
  npm run typecheck
  npm run lint
  npm test
  npm run build
  npm run dev   # http://localhost:3000
  ```
  Set `NEXT_PUBLIC_SITE_URL` to your public https origin for a real build; the
  demo warns (does not fail) on a localhost origin.

## Current milestone
Website Builder — **complete**. Any business → themed, JSON/block-driven site.

### Website Builder (this milestone — `lib/builder/`, `templates/`, `components/blocks/`)
- `types.ts` builder contracts; `themes/` 8 CSS-variable themes + `ThemeProvider`.
- `components/blocks/` 22 blocks; `blocks/registry.ts` + `BlockRenderer`.
- `industries/` 5 packs; `templates/` 4 templates (JSON layouts + inheritance).
- `compose.ts` page composer; `select.ts` heuristic + `aiSelectBuild`.
- `registry/` aggregate registries (section/component/theme/industry/template/generator).
- `app/preview/page.tsx` live demo (template/theme/industry/page switch, noindex).
- **Flow:** business → `selectBuild` → template+theme; `composePage(template,pageType)`
  → `PageDefinition`; `buildBlockContext` + `resolvePageContent` → `<ThemeProvider><BlockRenderer/>`.

### AI Rendering Engine (this milestone — under `lib/ai/` + wired pages)
- `render.ts` cache-first read-only resolver (never blocks); `validation.ts`
  validate + auto-repair; `hash.ts` business/content hashing.
- `versioning.ts` status + history + rollback; `generation.ts` enumerate + batch.
- Cache entries extended with status/businessVersion/ttl/hash (backward compatible).
- API routes: regenerate, status, cache (list/history/delete/rollback), batch,
  provider, prompts. Pre-gen script `scripts/pregenerate.mjs` (`npm run ai:pregenerate`).
- **Workflow:** `npm run ai:pregenerate` (with a provider set) → `npm run build`
  bakes AI into static pages. With no cache, pages render deterministic content.

### AI Content Engine (Phase 7 — unchanged foundation)
- providers, prompts, cache, agents, content-service, blog generators, image prompts.

### AI Content Engine (this milestone — all under `lib/ai/`)
- `types/` unified contracts; `config.ts` env-driven provider selection.
- `providers/` openai, anthropic, gemini, openrouter, mock + factory (fetch-based).
- `prompts/` versioned page/field/blog templates (`PROMPT_LIBRARY_VERSION = 1.0.0`).
- `cache/` file + memory stores, stable keys, timestamps, regeneration.
- `services/` content-service (orchestrator), deterministic fallback, image-prompts,
  blog generators, retry, rate-limit.
- `agents/` 18 reusable agents + registry. `context.ts` context builders. `index.ts` barrel.
- API: `app/api/ai/generate/route.ts` (generate + regenerate one page).
- To enable live AI: set `AI_PROVIDER` + the matching key (see `.env.example`).

## Completed features
### Generator Core (prior milestone — unchanged)
- Tooling, `BusinessConfig` Zod schema, config selectors, content + SEO engines.
- Pages: home, about, contact, `/services/[slug]`, `/locations/[state]/[city]`, `/generate`, 404.
- `sitemap.ts`, `robots.ts`, `manifest.ts`, `/api/generate`, `/api/lead`.

### Nationwide SEO Generator (this milestone)
- **Geo taxonomy** (`lib/generator/config.ts`): counties, ZIPs, neighborhoods, nearby
  cities/ZIPs/counties, service×city matrix, new path builders, expanded `getAllPaths`.
- **Internal link engine** (`lib/generator/links.ts`): per-page-type link clusters
  (service, city, service×city, state, county, ZIP, neighborhood) + `RelatedLinks` component.
- **Content engine additions** (`lib/generator/content.ts`): service×city / county / ZIP /
  neighborhood / state intros + metas, `locationStats`, `commonProblems`, `emergencyCtaCopy`,
  `serviceCityFaqs` — all deterministic-unique per page.
- **SEO additions** (`lib/seo/schema.ts`): `serviceInCitySchema`, `placeSchema`
  (AdministrativeArea/PostalCodeArea/Place), `speakableSchema`, `imageObjectSchema`,
  `articleSchema`. Metadata: geo tags + hreflang (`lib/seo/metadata.ts`).
- **New routes:** `/locations/[state]`, `/locations/[state]/county/[county]`,
  `/locations/zip/[zip]`, `/locations/[state]/[city]/[neighborhood]`,
  `/services/[slug]/[state]/[city]` (ISR).
- **New components:** `RelatedLinks`, `StatBar`, `CommonProblems`, `EmergencyCTA`.
- Existing city + service pages extended (additively) with the link engine.

## Production Hardening (Phase 5.5 — this session)
Consistency/reliability/correctness pass; driven by two full audits. All changes
keep `typecheck`/`lint`/`test`/`build` green. See CHANGELOG `[0.5.1]` for detail.
- **Config:** `data/business.ts` `siteUrl` now derives from `resolveSiteUrl()`
  (`lib/site.ts`); `assertProductionSiteUrl()` wired at build (warn by default,
  `{ strict: true }` throws). `openrouter.ts` uses `resolveSiteUrl()` too.
- **Lead reliability:** `/api/lead` now rate-limited (`LIMITS.lead()`) + `nodejs`
  runtime; honeypot schema fixed so bots are silently dropped (not `422`'d);
  delivery seam wrapped (→ `502` on failure).
- **Cache consistency:** shared `isCacheEntryFresh()` (`lib/ai/cache/freshness.ts`)
  used by both `render.ts` and `content-service.ts`; content repaired before
  caching so API output matches rendered pages.
- **Error handling:** `serverError()` helper; AI generate/regenerate/batch/cache
  core logic wrapped for a consistent `{ error }` shape. `GET /api/ai/cache` is
  now admin-gated.
- **Metadata:** `/generate` is `noindex` via `app/generate/layout.tsx`.
- **Docs:** new `SECURITY.md`; `.env.example` documents `ADMIN_API_TOKEN`,
  `RATE_LIMIT_*`, `ALLOW_LOCALHOST_BUILD`.
- **Testing:** `tests/` + `npm test` — 17 zero-dependency `node --test` cases
  (lead/honeypot, rate limiter, site-URL guard, cache freshness).

## Phase 6 — Restructuring & Engineering Standards (this session)
Reorganized implemented code into the enterprise layout; documented future
modules without scaffolding. See CHANGELOG `[0.6.0]`, `ARCHITECTURE.md`, and
`docs/decision-log.md`.
- **Moves (git mv):** `themes/` + `industries/` promoted to repo root; `LeadForm`
  → `components/forms/`; `JsonLd` → `components/seo/`. All `@/…` aliases rewritten.
- **New:** root `ARCHITECTURE.md`; `docs/` (ai/builder/seo/api/testing/deployment/
  contributing/decision-log + index); `.github/` (CI + issue/PR templates);
  `.ai/` (working memory, pointers to this manifest).
- **Kept in place (deliberate):** `components/site/` (92 refs, no gain from
  rename), `lib/ai/cache/` (AI-coupled), `lib/api|forms|leads`, flat `templates/`,
  and **`app/` routing untouched** (max SEO safety). `public/` not created (no
  assets yet). Rationale in `docs/decision-log.md`.

## Planned / Not Yet Implemented
Documented in `ARCHITECTURE.md` (§2) and `ROADMAP.md`. **No folders or stub code
exist for these** — a directory is created only when real code lands.

| Module | Target location | Depends on | Phase |
| --- | --- | --- | --- |
| Logging / Observability | `lib/logging/` | cross-cutting | 15+ (adopt early) |
| Blog Engine (pages) | `app/blog/`, `lib/blog/` | AI + SEO (exist) | 8 |
| CRM / Lead pipeline | `lib/crm/` | database, Auth | 10 (completion) |
| Media / Image Engine | `lib/media/`, `public/` | AI, storage | 9 |
| Authentication & Orgs | `lib/auth/`, `app/(auth)/` | database | 1 (foundational) |
| Customer Dashboard | `app/dashboard/` | Auth | 12 |
| Admin console | `app/admin/`, `lib/admin/` | Auth | 11 |
| Billing / Credits | `lib/billing/` | Auth | 13 |
| Deployment / Domains | `lib/deployment/` | Auth, Billing | 14 |
| Analytics | `lib/analytics/` | Auth | 15+ |

Recommended build order (value ÷ dependency): Logging → Blog → CRM → Media →
Auth → Dashboard → Admin → Billing → Deployment → Analytics (see `ARCHITECTURE.md` §4).

## Current task
None in progress. Phase 6 (Restructuring) complete and build-verified.

## Next task (resume here)
Pick ONE:
1. **Adopt the builder on live routes:** have the real page routes render via
   `composePage` + `BlockRenderer` (behind the existing layouts) so the whole site
   is block-driven, not just `/preview`. Low risk — the engine is proven.
2. **Expand builder breadth:** add the remaining industry packs + vertical
   templates (roofing/mold/cleaning/tree-service/pest-control/…) — one file each.
3. **Phase 8 — Blog Engine (pages):** blog routes/pages/RSS on the built generators.

Recommended: **#1** — makes the Website Builder the actual rendering path sitewide.

## Known gaps / honest notes (Website Builder)
- The builder renders at **`/preview`** and is fully wired, but the **production
  page routes still use their own JSX** (they were not converted, to preserve the
  verified build). Making them render through `BlockRenderer` is Next task #1.
- Shipped breadth: **8 themes, 22 blocks, 5 industries, 4 templates** — the full
  industry/template lists from the brief are extensible one file at a time.
- Team/before-after blocks use clearly-generic placeholders (no fabricated people
  or photos); gallery uses real config images where present, else captioned tiles.
- `aiSelectBuild` is coded but only exercised via the heuristic fallback offline.

## Known gaps / honest notes (earlier phases)
- Live provider calls (OpenAI/Anthropic/Gemini/OpenRouter) are **coded and
  structured** but only the OpenAI error-recovery path was exercised (bad key).
  Real-key output quality/pre-gen at scale is unverified in this environment.
- AI appears on **statically generated** pages only after `ai:pregenerate` → `build`
  (or ISR revalidation). Post-build cache writes don't change already-built HTML —
  this is expected SSG behavior, documented in the README workflow.
- Image generation is **prompts only** — no image files are produced yet (Phase 9).
- Content-management surfaces (registry/logs/browser) are exposed as **API
  endpoints** (`/api/ai/*`), not a UI dashboard (deferred with admin/dashboard work).

## Known bugs / risks
- Deps are pinned to `^` ranges; if `npm install` resolves an incompatible React 19 /
  Next 15 combo, pin exact versions.
- Content is deterministic (not AI yet) — intentional for a runnable, offline core.

## Dependencies / migrations
- No database yet (Generator Core renders from an in-repo config object).
- No env vars required to run the core. `.env.example` lists vars for future phases.

## Last successful build
- Production Hardening (Phase 5.5) — `npm run build` succeeded (Next.js 15.5.20),
  **83 routes**; `npm test` 17/17; `typecheck` + `lint` clean. Route topology
  unchanged from the Website Builder milestone (`/preview` dynamic, `/generate`
  now `noindex`). On a localhost origin the build logs one site-URL warning (set
  `NEXT_PUBLIC_SITE_URL` to silence it / emit real canonical URLs).
- Prior — Nationwide SEO Generator: sitemap = 66 URLs; SSG matrix for
  services × cities/states/counties/zips/neighborhoods (ISR 1d on the matrix).
