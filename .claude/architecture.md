# Architecture — AI Session Map

> **Canonical source: root [`ARCHITECTURE.md`](../ARCHITECTURE.md)** (implemented +
> planned + gap analysis + implementation order) and the deep dives in
> [`docs/`](../docs/). This file is the *operational map* — where each subsystem
> lives, how data flows, and where to change things — so a session can act fast
> without re-reading everything. Do not duplicate ARCHITECTURE.md here; extend it.

## Layer model (dependency flows downward)

```
Routing / Pages     app/**                       Next routes, metadata, JSON-LD
Presentation        components/{ui,layout,builder,blocks,forms,seo,site}
Domain engines      lib/builder · lib/seo · lib/generator
                    themes/ · industries/ · templates/         (builder assets)
Content + render    lib/ai (providers, prompts, cache, services, render, agents)
Platform / cross    lib/api (security, rate-limit) · lib/site.ts · lib/utils.ts
Configuration       data/business.ts  ← the single BusinessConfig
```

## Subsystems — where to change what

| Subsystem | Location | Change here when… |
| --- | --- | --- |
| **Routing** | `app/**/page.tsx` (+ `sitemap.ts`, `robots.ts`, `manifest.ts`) | adding/altering pages; keep sitemap+routes invariant |
| **Generator** | `lib/generator/{schema,config,content,links}.ts` | config shape, geo taxonomy, path builders, per-page copy, internal links |
| **SEO engine** | `lib/seo/{metadata,schema}.ts`, `components/seo/JsonLd.tsx` | metadata builders, JSON-LD types |
| **AI content** | `lib/ai/{providers,prompts,services,agents}` | provider calls, prompt templates (versioned), generation orchestration |
| **AI rendering** | `lib/ai/render.ts` | how pages resolve cached vs deterministic content (read-only) |
| **Cache** | `lib/ai/cache/*` (freshness in `freshness.ts`) | cache store, keys, freshness rule (ONE rule, shared) |
| **Website Builder** | `lib/builder/{compose,select,context,registry,blocks}` | page composition, build selection, wiring |
| **Themes** | `themes/` (`registry`, `css`, tokens) | add/edit a theme → register in `themes/registry` |
| **Industries** | `industries/` (`registry`) | add/edit an industry pack → register in `industries/registry` |
| **Templates** | `templates/` (`base`, per-vertical, `registry`) | add a vertical layout (inherits `base`) |
| **Blocks** | `components/blocks/*` + `lib/builder/blocks/registry` | add/edit a block → register by name |
| **API** | `app/api/**` + `lib/api/{security,rate-limit}` | routes, admin auth, rate limits, error shape |
| **Origin** | `lib/site.ts` | the ONLY place to resolve `NEXT_PUBLIC_SITE_URL` |

## Rendering flow (request → HTML)

```
data/business.ts ──▶ lib/generator (paths, content, links)
                 ├─▶ lib/seo (metadata + JSON-LD) ──▶ page + components/seo/JsonLd
                 ├─▶ lib/builder (selectBuild → composePage) ──▶ components/builder/BlockRenderer
                 └─▶ lib/ai/render.resolvePageContent (cache-first, deterministic fallback)
```

`resolvePageContent` is **read-only**: never calls a provider, never writes at
render → pages can't block or incur cost. Generation happens out-of-band
(`lib/ai/services/content-service.ts`, `/api/ai/*`, `scripts/pregenerate.mjs`).

## Website Builder flow

```
business + industry pack → selectBuild()  → { template, theme, industry }
template + pageType       → composePage()  → PageDefinition (ordered blocks)
PageContext + AI content  → buildBlockContext()
                          → <ThemeProvider><BlockRenderer/></ThemeProvider>
```
Registries are the single wiring point; no page hardcodes a layout. Detail:
[`docs/builder.md`](../docs/builder.md).

## Dependency graph (hot-spots; import counts)
`@/lib/ai` 145 · `@/components/site` 92 · `@/lib/generator` 73 · `@/lib/builder` 49
· `@/components/ui` 35 · `@/lib/utils` 27 · `@/lib/seo` 26 · `@/data/business` 23 ·
`@/lib/api` 19. **Zero circular dependencies** (madge-verified). `themes/` and
`industries/` depend on `lib/builder/types.ts` (contract) and are consumed by
`lib/builder/*` + `components/builder/*`.

## Single sources of truth (do not fork these)
- **Site origin:** `lib/site.ts` `resolveSiteUrl()` (env `NEXT_PUBLIC_SITE_URL`).
- **Business config:** `data/business.ts` (validated by `lib/generator/schema.ts`).
- **Cache freshness:** `lib/ai/cache/freshness.ts` `isCacheEntryFresh()` (used by
  both `render.ts` and `content-service.ts`).

## Invariants (verify on any structural change)
- Sitemap: **66 URLs**. Prerendered routes: **71** (83 total). JSON-LD: 4 blocks on
  the home page. Diff against a pre-change snapshot; must match unless intended.

## Future architecture
Documented, not scaffolded, in [`ARCHITECTURE.md`](../ARCHITECTURE.md) §2 (per-module
purpose/responsibilities/location/dependencies/phase) and `.claude/future-features.md`.
