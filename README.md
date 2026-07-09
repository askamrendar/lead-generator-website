# Lead Generator Website

An AI-ready SaaS foundation that generates complete, SEO-optimized **nationwide local
business websites** from a single business-information config.

This repository is the **Generator Core** milestone: a runnable Next.js 15 application
that turns one typed business config into a full multi-page marketing site —
homepage, service pages, location pages, contact, lead capture, structured data,
sitemap, and robots — with a live intake form that produces new configs.

> **Status:** v0.6.0 — Generator Core, SEO Engine, AI Content + Rendering, Website
> Builder, and Production Hardening complete; repository restructured to the
> enterprise layout (Phase 6). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the
> full picture, [`ROADMAP.md`](./ROADMAP.md) for the phased plan, and
> [`PROJECT_MANIFEST.md`](./PROJECT_MANIFEST.md) for the exact next task.

---

## What it does today

Point it at a `BusinessConfig` (see [`data/business.ts`](./data/business.ts)) and it renders:

- **Homepage** — hero, services grid, service areas, stats, reviews, FAQ, lead form
- **Service pages** (`/services/[slug]`) — hero, benefits, process, why-us, FAQ, related links
- **Location pages** (`/locations/[state]/[city]`) — localized copy, services offered, ZIP/neighborhood coverage
- **About & Contact** — company story, hours, map embed, lead form
- **SEO engine** — per-page `<title>`/meta, canonical, OpenGraph/Twitter, and JSON-LD
  (`LocalBusiness`, `Service`, `FAQPage`, `BreadcrumbList`, `WebSite`)
- **`/generate`** — a Zod-validated intake form that builds a new config and previews the JSON

Every page's copy is produced by the **content engine** ([`lib/generator/content.ts`](./lib/generator/content.ts)),
which deterministically varies wording per service/location so pages are not byte-identical.
The engine exposes clean seams where an LLM call can replace the deterministic templates.

---

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS 3 · shadcn-style UI ·
React Hook Form · Zod · Framer Motion · Lucide.

---

## Quick start

```bash
cd "~/Downloads/Lead Generator Website"
npm install
npm run dev
# open http://localhost:3000
```

Verify the build (all four must pass — CI runs the same set):

```bash
npm run lint        # next lint
npm run type-check  # tsc --noEmit
npm test            # node --test (17 cases, zero deps)
npm run build       # next build (83 routes)
```

---

## Project structure

Root alias `@/*` → repo root. Full detail in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

```
app/                       # App Router routes (all generated from config)
  layout.tsx page.tsx      # root layout + homepage
  about/ contact/ generate/# company pages + intake form
  services/[slug]/…        # dynamic service + service×city pages
  locations/…              # state / city / county / zip / neighborhood pages
  preview/                 # live Website Builder demo (noindex)
  api/{lead,generate,ai/*} # lead capture, config validation, AI management
  sitemap.ts robots.ts manifest.ts not-found.tsx globals.css
components/
  ui/                      # primitives (button, card, input, …)
  layout/                  # Header, Footer, Breadcrumbs, StickyCallButton
  builder/                 # BlockRenderer, ThemeProvider
  blocks/                  # 22 builder blocks
  forms/                   # LeadForm
  seo/                     # JsonLd
  site/                    # page-section components (Hero, FAQ, Reviews, CTAs, …)
lib/
  ai/                      # providers, prompts, cache (+ freshness), services,
                           # agents, render, validation, versioning, generation
  api/                     # security (admin auth, rate limit, serverError)
  builder/                 # types, blocks, compose, select, context, registry
  generator/               # schema (Zod config), config (geo/paths), content, links
  seo/                     # metadata + JSON-LD builders
  forms/ leads/            # intake/lead schemas + lead record types
  site.ts utils.ts         # canonical origin (single source of truth) + cn()
themes/                    # 8 CSS-variable themes + ThemeProvider tokens
industries/                # 5 industry packs (plumbing/hvac/roofing/electrical/generic)
templates/                 # base/plumber/hvac/generic JSON layouts + registry
data/business.ts           # sample business (Apex Plumbing Co.)
scripts/                   # pregenerate.mjs
tests/                     # node --test suites
docs/                      # deep-dive docs + decision log
.github/                   # CI workflow + issue/PR templates
.ai/                       # agent working memory (pointers + logs)
```

---

## How the generator works

1. A `BusinessConfig` object is the single source of truth (validated by Zod).
2. Route segments (`[slug]`, `[state]/[city]`) enumerate `generateStaticParams()` from the config.
3. Each page pulls its data via selectors in `lib/generator/config.ts`.
4. Copy comes from `lib/generator/content.ts`; SEO comes from `lib/seo/*`.
5. To generate a *different* business site, swap the config — nothing else changes.

To wire real AI, replace the deterministic functions in `content.ts` with calls to the
Vercel AI SDK / OpenAI SDK. The function signatures are designed to be drop-in.

---

## AI Content Engine (`lib/ai/`)

A modular, **provider-agnostic** AI layer sits on top of the deterministic engine.
With no API key it runs the deterministic content as an offline fallback; set a
provider to switch on live AI — **no page or SEO code changes either way**.

```
lib/ai/
  types/            # shared contracts (PageContext, GeneratedPageContent, AIProvider…)
  config.ts         # env-driven provider/model/temperature/limits
  providers/        # openai, anthropic, gemini, openrouter, mock (+ factory)
  prompts/          # versioned page/field/blog prompt templates
  cache/            # file + memory stores, stable keys, timestamps
  context.ts        # build a PageContext from the config for any page
  services/         # content-service (orchestrator), deterministic fallback,
                    # image-prompts, blog generators, retry, rate-limit
  agents/           # 18 reusable agents + registry
  index.ts          # public barrel
```

**Provider abstraction.** Every provider implements one `AIProvider` interface
(`complete`, optional `stream`). The active provider is chosen by `AI_PROVIDER`
and resolved in `lib/ai/config.ts`. Providers use `fetch` directly — no SDK
dependencies. If the selected provider has no key, the engine uses the `mock`
provider, which yields the deterministic fallback content.

**Prompt library.** All prompts live in `lib/ai/prompts/` and are versioned by
`PROMPT_LIBRARY_VERSION`. Page logic never embeds prompt strings — it looks up a
template. Bumping the version transparently invalidates cached content.

**Cache layer.** `lib/ai/cache/` persists one JSON file per page under
`.ai-cache/` (gitignored) with an in-memory read-through layer and generation
timestamps. Keys are derived from page identity + prompt version.

**Regeneration.** Content is regenerated **per page**, never site-wide:

```bash
# generate (cache-first) content for one page:
curl -X POST localhost:3000/api/ai/generate \
  -H 'content-type: application/json' \
  -d '{"pageType":"serviceCity","params":{"serviceSlug":"drain-cleaning","stateSlug":"texas","citySlug":"austin"}}'

# force a fresh generation for that page only:
#   add  "regenerate": true
```

**Enable live AI:** copy `.env.example` → `.env.local` and set e.g.
`AI_PROVIDER=openai` + `OPENAI_API_KEY=...`. See `.env.example` for all options.

### Rendering pipeline (cache-first, never blocks)

Pages render through `resolvePageContent(ctx)` (`lib/ai/render.ts`):

```
Business Config → Page Context → Cache Lookup → validate/repair → AI content
                                          ↘ (miss / stale / invalid) → Deterministic
```

This resolver is **read-only**: it never calls a provider and never writes at
render time, so a page can never block on the network or incur cost. If the cache
holds a valid, non-archived, current-version AI entry it renders that (repaired for
completeness); otherwise it renders the deterministic baseline. Every content page
(home, about, service, service×city, city, state, county, ZIP, neighborhood) is
wired this way, for both body copy and `<title>`/meta.

Cache entries carry `status`, `businessVersion`, `ttlSeconds`, and a content hash;
an entry is treated as stale (→ fallback) when the prompt version bumps, the
business config changes, or the TTL elapses.

### Generation workflow (pre-generate → build)

Because pages are statically generated, AI content is baked in at build time. The
intended flow:

```bash
# 1. start the app so the batch endpoint is reachable
npm run start &          # or: npm run dev

# 2. populate .ai-cache/ (whole site, or a scope)
npm run ai:pregenerate            # AI_SCOPE=matrix / AI_REGENERATE=1 supported

# 3. rebuild so the static pages read the cache
npm run build
```

With no provider configured, pre-generation warms the cache with the deterministic
baseline (harmless); with a provider it writes real AI content. Individual pages can
be regenerated via `POST /api/ai/regenerate`, and versions rolled back via
`POST /api/ai/cache { action: "rollback", key }`.

### AI API surface

`/api/ai/generate` · `/api/ai/regenerate` · `/api/ai/status` · `/api/ai/cache`
(list / history / delete / rollback) · `/api/ai/batch` · `/api/ai/provider` ·
`/api/ai/prompts`.

> Note: image generation is **prompts only** so far (no image files yet), and the
> content-management surfaces are API endpoints rather than a UI dashboard — both
> are tracked in `PROJECT_MANIFEST.md`.

## Website Builder (`lib/builder/`, `templates/`, `components/blocks/`)

A reusable, industry-agnostic builder layered on top of the generator. A business
becomes a **themed, JSON/block-driven website** — no page layout is hardcoded.

```
business + industry pack  →  selectBuild()   →  template + theme
template + pageType       →  composePage()   →  PageDefinition (ordered blocks)
PageContext + AI content  →  buildBlockContext()
                          →  <ThemeProvider><BlockRenderer page ctx/></ThemeProvider>
```

- **Themes (8):** light, dark, modern, luxury, corporate, minimal, blue-collar,
  medical — each a set of CSS-variable design tokens. `ThemeProvider` applies a
  theme to any subtree (server-rendered), re-skinning every block instantly.
- **Blocks (22):** hero, benefits, problems, stats, trust-badges, reviews,
  testimonials, timeline, team, pricing, before-after, gallery, service-grid,
  location-grid, related-services, related-locations, faq, lead-form, map, cta,
  emergency-banner, rich-text. Each is independent, configurable, and reads the
  shared `BlockContext`. Registered by name in `lib/builder/blocks/registry.ts`.
- **JSON pages:** a `PageDefinition` is `{ blocks: [{ type, props }] }`. The
  `BlockRenderer` maps each block to its component — the page is data, not code.
- **Industry packs (5):** plumbing, hvac, roofing, electrical, generic — services,
  terminology, FAQs, schema type, image keywords, blog categories, prompt hints,
  and default theme/template.
- **Templates (4):** base, plumber, hvac, generic — per-page JSON layouts that
  inherit from `base`. Adding a vertical = one file + one registry entry.
- **Selection:** `selectBuild(business)` matches the category → industry pack →
  default template + theme (deterministic). `aiSelectBuild()` lets the configured
  AI provider pick from the registries, falling back to the heuristic.

**Try it:** `npm run dev` then open **`/preview`**. Switch template, theme,
industry, and page type live via the control bar:

```
/preview?template=hvac&theme=corporate&industry=hvac&page=service
```

> The builder currently renders at `/preview`; the production routes still use
> their own JSX (preserved from earlier phases). Converting them to render through
> `BlockRenderer` is the documented next step in `PROJECT_MANIFEST.md`.

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — implemented + planned architecture, gap analysis, implementation order
- [`docs/`](./docs/) — deep dives (ai, builder, seo, api, testing, deployment, contributing) + [decision log](./docs/decision-log.md)
- [`ROADMAP.md`](./ROADMAP.md) — phased plan + future-module milestones
- [`PROJECT_MANIFEST.md`](./PROJECT_MANIFEST.md) — build status + resume point + planned register
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes
- [`SECURITY.md`](./SECURITY.md) — security posture
- [`LICENSE`](./LICENSE)

## License

MIT — see [`LICENSE`](./LICENSE).
