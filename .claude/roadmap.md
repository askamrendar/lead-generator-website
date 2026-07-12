# Roadmap — Future Releases

> This file supplements **`PROJECT_MEMORY.md`**. `PROJECT_MEMORY.md` (project root) is the
> canonical project memory — read it first.

> Canonical, richer versions: [`ROADMAP.md`](../ROADMAP.md) (phase checklist) and
> [`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md) (per-phase objectives/deps/risks/
> deliverables/success criteria). This file maps those to **version milestones**.

## v0.6.0 — Enterprise Architecture Release ✅ (current baseline)
Clean, documented, production-hardened generation platform. Future modules
documented, not scaffolded.

## v0.7 — SaaS Foundation + Visual Builder
> **Resequenced (2026-07-10):** Auth + multi-tenancy (originally slated for v0.9) was
> pulled forward as **Phase 7.1** by explicit instruction; the Visual Builder became
> **Phase 7.2**. History preserved — see ADR-0007 and `.claude/progress.md`.

### Phase 7.1 — SaaS Foundation ✅ Production Approved (0.7.0-alpha)
Auth.js v5 (Credentials + Google/GitHub, JWT) · Prisma 6 / PostgreSQL · multi-tenancy
`Organization → Workspace → Project → Website` · RBAC · register/verify/reset APIs ·
middleware guard · Docker dev DB / Neon prod. Architecture review passed (PR 9/10).

### Phase 7.2 — Authenticated product surface + Visual Builder ⏳
Ordered sub-milestones (build one at a time; **verify + stop + present** after each;
no auto-continue):
- **7.2.0 — Tenant Access Guard:** mandatory scoped data-access layer (`requireWorkspaceAccess`
  / `requireProjectAccess` / `requireWebsiteAccess`) + auth error→HTTP mapping. Foundation
  for every resource query (review finding H2 / `T-035`). Built **before** any CRUD.
- **7.2.1 — Authentication UI:** login / register / forgot / reset / verify pages over the
  existing 7.1 APIs.
- **7.2.2 — Dashboard Foundation:** dashboard **shell first** (layout, sidebar, header, user
  menu, org switcher, workspace switcher, breadcrumbs, settings nav), **then** CRUD for
  Workspace / Project / Website — every operation via the 7.2.0 guard.
- **7.2.3 — Website Manager:** dedicated Website **management** surface (name, slug, industry,
  theme, template, status, created/updated; actions: create, duplicate, archive, delete,
  open builder). Manages Websites — distinct responsibility from the editor.
- **7.2.4 — Visual Builder:** the **editor**, built on the existing Theme/Template/Industry/
  Block/Preview engines; persists to `Website.builderConfig`. No second builder format. The
  Website Manager manages; the Visual Builder edits — responsibilities kept separate.
- **7.2.5 — Production Route Adoption:** adopt `BlockRenderer` on production routes behind the
  feature flag only after metadata / JSON-LD / sitemap / route / SEO **parity** is verified.
- **Risks:** editor SSR/hydration; SEO parity on route adoption (flag + byte-diff gate);
  CMS scope creep (bound each sub-milestone to its gate).
- **Blog pages** (article/category/tag/RSS) move to a later phase (were bundled here before).

## v0.8 — Media + CRM + Logging
- **Features:** real image generation + storage (`lib/media/`, `public/`); lead
  delivery/persistence (`lib/crm/`) implementing the `/api/lead` seam; structured
  logging (`lib/logging/`) adopted cross-cutting.
- **Goals:** real assets, real lead value, observability before SaaS layers.
- **Risks:** generation cost/latency, storage/licensing, log volume/PII.
- **Dependencies:** a datastore (CRM), image provider/storage.

## v0.9 — (superseded) Auth + Multi-tenancy + Dashboard
> **Resequenced:** the Auth + multi-tenancy foundation shipped early as **Phase 7.1**
> (see v0.7 above); the customer **dashboard** is now **Phase 7.2** (7.2.2–7.2.3). This
> slot is retained for history. Remaining original scope (config regenerate, lead inbox)
> folds into 7.2 / v0.8 CRM.
- **Delivered early (7.1):** accounts/orgs/RBAC + Prisma/Postgres + tenant model.
- **Now in 7.2:** dashboard, workspace/project/website CRUD, website manager, builder.

## v1.0 — Monetized SaaS (Billing + Deployment + Analytics + Admin)
- **Features:** subscriptions + usage credits (meter AI); one-click deploy + custom
  domains; analytics; admin console; polish/perf/a11y/security audit.
- **Goals:** production SaaS: generate → publish → monetize, multi-tenant.
- **Risks:** webhook idempotency/metering; DNS/SSL automation; multi-tenant build
  isolation; privacy/consent; scale (shared rate-limit/cache store, edge CSP/HSTS).
- **Dependencies:** Auth (v0.9), then Billing → Deployment.

## Beyond v1.0
White-label/reseller, template marketplace, plugin system, team collaboration,
advanced analytics/experimentation. See `.claude/future-features.md`.

## Guiding cadence
- Every release ships behind a **green build** (lint → type-check → test → build).
- **Document-then-build; no scaffolding** — create a module's folder only when real
  code lands.
- Preserve route/SEO invariants; update docs on every phase change.
