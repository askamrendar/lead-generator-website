# Roadmap — Future Releases

> Canonical, richer versions: [`ROADMAP.md`](../ROADMAP.md) (phase checklist) and
> [`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md) (per-phase objectives/deps/risks/
> deliverables/success criteria). This file maps those to **version milestones**.

## v0.6.0 — Enterprise Architecture Release ✅ (current baseline)
Clean, documented, production-hardened generation platform. Future modules
documented, not scaffolded.

## v0.7 — Visual Builder + Blog
- **Features:** live block editor (drag-order, prop edit, theme/template switch,
  preview, persist `PageDefinition`); adopt `BlockRenderer` on production routes;
  **Blog pages** (article/category/tag/RSS) on existing generators.
- **Goals:** the builder becomes the real rendering path; content marketing surface.
- **Risks:** SSR/hydration for the editor; SEO parity when routes move to
  `BlockRenderer` (keep sitemap/metadata/JSON-LD identical); thin-content risk on blog.
- **Dependencies:** builder engine (done); persistence (JSON export first).
- **Timeline:** first post-baseline release.

## v0.8 — Media + CRM + Logging
- **Features:** real image generation + storage (`lib/media/`, `public/`); lead
  delivery/persistence (`lib/crm/`) implementing the `/api/lead` seam; structured
  logging (`lib/logging/`) adopted cross-cutting.
- **Goals:** real assets, real lead value, observability before SaaS layers.
- **Risks:** generation cost/latency, storage/licensing, log volume/PII.
- **Dependencies:** a datastore (CRM), image provider/storage.

## v0.9 — Auth + Multi-tenancy + Dashboard
- **Features:** accounts/orgs/RBAC + database (Prisma + Postgres); tenant scoping;
  customer dashboard (config CRUD, regenerate, preview, lead inbox).
- **Goals:** the SaaS foundation — everything below depends on it.
- **Risks:** session/security correctness; tenant isolation; first DB/migration ops.
- **Dependencies:** none upstream (this is the critical-path unlock).

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
