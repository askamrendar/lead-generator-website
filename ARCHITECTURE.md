# Architecture — Lead Generator Website

This document describes the **implemented** system, the **planned** future
architecture, a **gap analysis**, and the **recommended implementation order**.

Principle: *the repository represents the implemented system, not the future
vision.* Future modules are documented here and given a folder **only when real
code lands**. There are no empty folders or stub files.

---

## 1. Implemented architecture

A config-driven, provider-agnostic static-site generator: a `BusinessConfig`
drives an SEO-optimized, AI-renderable, block-composed website. It builds and
runs fully offline; AI and a public origin are optional enhancements.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind 3
· Zod · Node 22. No database; deterministic content is the offline baseline.

### 1.1 Layers (dependency flows downward)

```
Routing / Pages         app/**                         Next.js routes, metadata, JSON-LD
  │
Presentation            components/{ui,layout,builder,blocks,forms,seo,site}
  │
Domain engines          lib/builder · lib/seo · lib/generator
  │                     themes/ · industries/ · templates/       (builder assets)
Content + rendering     lib/ai (providers, prompts, cache, services, render, agents)
  │
Platform / cross-cut    lib/api (security, rate-limit) · lib/site.ts · lib/utils.ts
  │
Configuration           data/business.ts  ← the single BusinessConfig instance
```

Higher layers depend on lower ones; `data/business.ts` (validated by
`lib/generator/schema.ts`) is the root input every page reads.

### 1.2 Directory map (as-is)

```
app/            routes (marketing pages, services, locations, preview, api) + root
                special files (layout, sitemap, robots, manifest, not-found, globals)
components/
  ui/           primitives (button, input, card, badge, label, slot, textarea)
  layout/       Header, Footer, Breadcrumbs, StickyCallButton
  builder/      BlockRenderer, ThemeProvider
  blocks/       22 builder blocks (content/media/social/action)
  forms/        LeadForm                    ← Phase 6
  seo/          JsonLd                       ← Phase 6
  site/         page-section components (Hero, FAQ, Reviews, Stats, CTAs, …)
lib/
  ai/           providers · prompts · cache (+ freshness) · services · agents ·
                render · validation · versioning · generation · context · hash · config
  api/          security (admin auth, rate-limit enforce, serverError), rate-limit
  auth/         Auth.js v5 (config/auth/middleware/session/providers) · password (scrypt) ·
                tokens · validation · provisioning · email seam · permissions (roles/rbac)
    access/     centralized tenant authorization (7.2.0): engine (pure) · errors ·
                context · resolver (require*Access registry) · http mapping — the ONLY
                supported way to read a tenant resource
  db/           prisma.ts (PrismaClient singleton)
  builder/      types · blocks · compose · select · context · registry
  generator/    config (geo taxonomy, paths) · content · links · schema
  seo/          metadata · schema
  forms/        intake · lead (Zod schemas)
  leads/        lead record types
  site.ts       canonical origin (single source of truth) + build guard
  utils.ts      cn() etc.
themes/         8 CSS-variable themes + ThemeProvider tokens     ← Phase 6 (from lib/builder)
industries/     5 industry packs                                  ← Phase 6 (from lib/builder)
templates/      base · plumber · hvac · generic (JSON layouts) + registry
data/           business.ts (sample: Apex Plumbing Co.)
prisma/         schema.prisma (auth + tenancy models) + migrations       ← Phase 7.1
middleware.ts   Edge auth guard for reserved authed routes               ← Phase 7.1
docker-compose.yml  local Postgres dev DB (Neon in prod)                 ← Phase 7.1
scripts/        pregenerate.mjs
tests/          node --test suites (generation + auth + access; 57 cases)
docs/           deep-dive docs + decision log
.github/        CI workflow + issue/PR templates
.ai/            agent working memory (pointers + logs)
```

### 1.3 Request / render data flow

```
data/business.ts ──▶ lib/generator (paths, content, links)
                 ├─▶ lib/seo (metadata + JSON-LD)  ──▶ app/**/page.tsx + components/seo/JsonLd
                 ├─▶ lib/builder (selectBuild → composePage) ──▶ components/builder/BlockRenderer
                 └─▶ lib/ai/render.resolvePageContent (cache-first, deterministic fallback)
app/api/lead ──▶ lib/forms/lead (validate) ──▶ [CRM/email seam]
app/api/ai/* ──▶ lib/ai/services (generate) ──▶ lib/ai/cache
```

### 1.4 Dependency & import map (hot-spots)

Root alias `@/*` → repo root. Most-imported domains (higher = more central):

| Domain | ~imports | Role |
| --- | --- | --- |
| `@/lib/ai` | 145 | content + rendering |
| `@/components/site` | 92 | page sections |
| `@/lib/generator` | 73 | paths / content / geo |
| `@/lib/builder` | 49 | template/block engine |
| `@/components/ui` | 35 | primitives |
| `@/lib/utils` | 27 | helpers |
| `@/lib/seo` | 26 | metadata / schema |
| `@/data/business` | 23 | config input |
| `@/lib/api` | 19 | security / limits |

No circular dependencies. `themes/` and `industries/` depend on
`lib/builder/types.ts` (contract) and are consumed by `lib/builder/*` and
`components/builder/*`.

### 1.5 Implemented modules

| Module | Location | Status |
| --- | --- | --- |
| Generator Core (config, paths, content, links) | `lib/generator/`, `data/` | ✅ |
| SEO Engine (metadata, JSON-LD, sitemap/robots/manifest) | `lib/seo/`, `components/seo/`, `app/` | ✅ |
| AI Content Engine (providers, prompts, agents, cache) | `lib/ai/` | ✅ |
| AI Rendering pipeline (cache-first, fallback) | `lib/ai/render.ts` | ✅ |
| Website Builder (templates, blocks, themes, industries) | `lib/builder/`, `themes/`, `industries/`, `templates/`, `components/blocks/` | ✅ |
| Lead capture (form + API + honeypot + rate limit) | `components/forms/`, `app/api/lead/`, `lib/forms/`, `lib/leads/` | ✅ (delivery seam only) |
| API security (admin auth, rate limiting, error shape) | `lib/api/` | ✅ |
| Production hardening (single-origin, cache unification) | `lib/site.ts`, `lib/ai/cache/freshness.ts` | ✅ |

---

## 2. Planned future architecture

Documented, **not scaffolded**. Each folder is created when its phase ships. See
`ROADMAP.md` for milestone tracking and `PROJECT_MANIFEST.md` for the
"Planned / Not Yet Implemented" register.

### Authentication & Organizations — `lib/auth/`, `app/(auth)/`
- **Purpose:** accounts, sessions, and multi-tenant orgs/teams.
- **Responsibilities:** sign-in/up, session management, RBAC, org membership,
  tenant scoping of every business config.
- **Dependencies:** database; consumed by Dashboard, Admin, Billing, Deployment.
- **Phase:** 1 (foundational).

### Dashboard (customer) — `app/dashboard/`, `components/dashboard/`
- **Purpose:** authenticated UI for a customer to manage their generated site(s).
- **Responsibilities:** business-config CRUD, AI regeneration triggers, preview,
  publish status, lead inbox.
- **Dependencies:** Auth, Generator Core, AI engine, Deployment, CRM.
- **Phase:** 12.

### Admin — `app/admin/`, `lib/admin/`
- **Purpose:** operator console across all tenants.
- **Responsibilities:** tenant/user management, content/cache oversight (wraps
  `app/api/ai/*`), usage + system health.
- **Dependencies:** Auth (elevated RBAC), AI engine, Analytics, Logging.
- **Phase:** 11.

### Billing / Subscriptions / Credits — `lib/billing/`, `app/(billing)/`
- **Purpose:** monetization and entitlement.
- **Responsibilities:** plans, subscriptions, usage metering (AI generations),
  credits, invoices, provider webhooks (e.g. Stripe).
- **Dependencies:** Auth/Orgs; gates AI generation and Deployment.
- **Phase:** 13.

### CRM / Lead pipeline — `lib/crm/`
- **Purpose:** turn captured leads into a managed pipeline.
- **Responsibilities:** implement the `app/api/lead` delivery seam — persistence,
  CRM/email/SMS adapters, dedupe, status, export. Extends `lib/leads/`.
- **Dependencies:** database, Auth (per-tenant), Logging.
- **Phase:** 10 (completion).

### Blog Engine (pages) — `app/blog/`, `lib/blog/`
- **Purpose:** publish the already-generated blog content as routes.
- **Responsibilities:** blog routing, article/category/tag pages, RSS,
  topic-cluster internal linking. Generators already exist in
  `lib/ai/services/blog.ts`.
- **Dependencies:** AI content engine, SEO engine.
- **Phase:** 8.

### Deployment / Custom Domains — `lib/deployment/`
- **Purpose:** one-click publish + custom domain attach.
- **Responsibilities:** host adapters (Vercel/Netlify/static export), domain +
  DNS/SSL, build triggers, per-tenant env injection.
- **Dependencies:** Auth (tenant), Billing (entitlement).
- **Phase:** 14.

### Media / Image Engine — `lib/media/`, `public/`
- **Purpose:** produce and serve real images (currently prompts-only).
- **Responsibilities:** image generation from `lib/ai/services/image-prompts.ts`,
  storage/CDN, optimization, alt-text wiring; first assets create `public/`.
- **Dependencies:** AI engine, storage provider.
- **Phase:** 9.

### Analytics — `lib/analytics/`
- **Purpose:** traffic + conversion insight.
- **Responsibilities:** event capture (page views, lead conversions, CTA clicks),
  privacy-aware aggregation, dashboard feeds.
- **Dependencies:** Auth (tenant scoping), Dashboard/Admin.
- **Phase:** 15+.

### Logging / Observability — `lib/logging/`
- **Purpose:** structured logs, metrics, error tracking.
- **Responsibilities:** a logger abstraction to replace ad-hoc `console.*`,
  request/audit logging, provider adapters (e.g. Sentry, OTel).
- **Dependencies:** cross-cutting (used by API, AI, CRM, Deployment).
- **Phase:** 15+ (adopt incrementally; highest cross-cutting leverage).

---

## 3. Gap analysis

| Capability | Have | Missing | Blocking dependency |
| --- | --- | --- | --- |
| Generate a site from config | ✅ full | — | — |
| SEO (meta + schema + sitemap) | ✅ full | Video schema, HTML sitemap page | — |
| AI content + rendering | ✅ full | verified live-provider output at scale | provider keys |
| Website builder | ✅ 8 themes / 22 blocks / 5 industries / 4 templates | more verticals, visual editor | — |
| Lead capture | ✅ form + API + anti-spam | **persistence + delivery** (CRM) | database |
| Images | prompts only | real image files + storage | Media + storage |
| Blog | generators only | **pages/routes/RSS** | Blog module |
| Accounts / multi-tenant | ❌ | auth, orgs, RBAC | **Auth (foundational)** |
| Dashboard / Admin | ❌ | authenticated UIs | Auth |
| Billing | ❌ | plans, metering, webhooks | Auth |
| Deployment / domains | ❌ | publish + DNS/SSL | Auth, Billing |
| Analytics / Logging | ❌ | event capture, structured logs | (Logging is cross-cutting) |

**Key gap:** everything multi-tenant (Dashboard, Admin, Billing, Deployment,
CRM persistence) is blocked on **Auth + database**. The generation engine itself
is feature-complete and production-hardened.

---

## 4. Recommended implementation order

Ordered by dependency and value; each step ships behind a green build.

1. **Logging** (`lib/logging/`) — small, cross-cutting; adopt a logger now so
   every later module is observable from day one. Low risk, high leverage.
2. **Blog pages** (`app/blog/`, `lib/blog/`) — highest value with **no new
   infra**; generators + SEO already exist. Pure additive routing.
3. **CRM delivery** (`lib/crm/`) — implement the existing lead seam (persistence
   + email adapter). Needs a datastore; unblocks real lead value.
4. **Media / Image engine** (`lib/media/`, `public/`) — turn image prompts into
   real optimized assets. Independent of auth.
5. **Auth & Orgs** (`lib/auth/`) — foundational for all multi-tenant work. The
   gate everything below depends on.
6. **Customer Dashboard** (`app/dashboard/`) — manage sites/leads once auth exists.
7. **Admin console** (`app/admin/`) — operator surface over tenants + AI cache API.
8. **Billing** (`lib/billing/`) — monetize; meter AI + gate deployment.
9. **Deployment / custom domains** (`lib/deployment/`) — publish flow.
10. **Analytics** (`lib/analytics/`) — insight once there is traffic + tenants.

Steps 1–4 deliver value with minimal/no new infrastructure; steps 5–10 build the
multi-tenant SaaS on the Auth foundation.
