# Next Release Plan — Post v0.6.0

Forward plan for the phases after the Enterprise Architecture Release. Each phase
ships behind a green build (`lint` → `type-check` → `test` → `build`) and follows
the "document-then-build; no scaffolding" rule — a module's folder is created only
when real code lands (see `ARCHITECTURE.md` §2).

Complexity: **S** (small, days) · **M** (medium, 1–2 wks) · **L** (large, 3–5 wks)
· **XL** (multi-milestone).

---

## Phase 7 — SaaS Foundation + Visual Builder
> **Resequenced (2026-07-10):** Auth/multi-tenancy (was "Phase 10") shipped first as
> **Phase 7.1**; the Visual Builder is now **Phase 7.2**. Milestone map lives in
> [`.claude/roadmap.md`](.claude/roadmap.md) (§ v0.7); ADR-0007 in `.claude/decisions.md`.

### Phase 7.1 — SaaS Foundation ✅ Production Approved (0.7.0-alpha)
Auth.js v5 (Credentials + Google/GitHub, JWT) · Prisma 6/PostgreSQL · multi-tenancy
`Organization → Workspace → Project → Website` · RBAC · register/verify/reset APIs ·
middleware guard · Docker/Neon. Architecture review passed (Production Readiness 9/10).

### Phase 7.2 — Authenticated product surface + Visual Builder ⏳ (approved plan)
Build sub-milestones in order; **verify (`lint`→`type-check`→`test`→`build`) + stop +
present after each**; no auto-continue.
- **7.2.0 Tenant Access Guard** — mandatory scoped data-access layer + auth error→HTTP
  mapping; the foundation every resource query routes through (`T-035`).
- **7.2.1 Authentication UI** — login/register/forgot/reset/verify pages over 7.1 APIs.
- **7.2.2 Dashboard Foundation** — shell first (layout, sidebar, header, user menu, org +
  workspace switchers, breadcrumbs, settings nav) → then Workspace/Project/Website CRUD,
  all via the guard.
- **7.2.3 Website Manager** — dedicated Website **management** (fields + create/duplicate/
  archive/delete/open-builder). Distinct from the editor.
- **7.2.4 Visual Builder** — the **editor** on the existing Theme/Template/Industry/Block/
  Preview engines; persists to `Website.builderConfig`; no second builder format.
- **7.2.5 Production Route Adoption** — adopt `BlockRenderer` behind the flag only after
  metadata/JSON-LD/sitemap/route/SEO **parity** is verified byte-identical.
- **Complexity:** L. **Risks:** editor SSR/hydration; SEO parity on adoption (flag +
  byte-diff gate); CMS scope creep (bound each sub-milestone to its gate).

## Phase 8 — Blog Engine (pages)
- **Objectives:** publish already-generated blog content as real routes — article,
  category, tag pages, RSS, and topic-cluster internal linking.
- **Dependencies:** `lib/ai/services/blog.ts` generators (exist), `lib/seo`
  (exists). **No new infrastructure.**
- **Complexity:** M
- **Risks:** thin/duplicate content hurting SEO; sitemap/feed correctness;
  incremental generation cost if AI-backed.
- **Deliverables:** `app/blog/**`, `lib/blog/` (routing/query), RSS route, Article
  JSON-LD, sitemap integration, internal-link wiring.
- **Success criteria:** blog index + article + category/tag routes build
  statically; valid RSS; Article schema present; sitemap includes posts.

## Phase 9 — Media / Image Engine
- **Objectives:** turn the existing image *prompts* into real, optimized assets
  with alt text; introduce `public/` for served assets.
- **Dependencies:** `lib/ai/services/image-prompts.ts` (exists); an image
  provider + storage/CDN.
- **Complexity:** M
- **Risks:** generation cost/latency; storage + licensing; layout shift; large
  bundle/asset budgets.
- **Deliverables:** `lib/media/` (generate/store/optimize), `public/` assets,
  `next/image` wiring, ImageObject JSON-LD populated.
- **Success criteria:** hero/OG/service images render from generated assets;
  Core Web Vitals unaffected; alt text on every image.

## Phase 10 — Authentication & Organizations
- **Objectives:** accounts, sessions, and multi-tenant orgs/teams with RBAC — the
  foundation for every SaaS surface.
- **Dependencies:** database (Prisma + PostgreSQL/Supabase). **Blocks Phases 11–14.**
- **Complexity:** L
- **Risks:** session/security correctness; tenant isolation of every business
  config; migration/DB ops introduced for the first time.
- **Deliverables:** `lib/auth/`, `app/(auth)/`, DB schema + migrations, tenant
  scoping of `data`/config, RBAC middleware.
- **Success criteria:** sign-up/in/out, org membership, role-gated routes; every
  business record scoped to a tenant; auth tests + protected-route tests pass.

## Phase 11 — Customer Dashboard
- **Objectives:** authenticated UI to manage a tenant's site(s): config CRUD, AI
  regeneration, preview, publish status, lead inbox.
- **Dependencies:** Auth (P10), Generator/AI/Builder engines, CRM (P for leads).
- **Complexity:** L
- **Risks:** wiring admin AI endpoints safely to UI; optimistic UI vs SSG
  rebuilds; access-control leaks across tenants.
- **Deliverables:** `app/dashboard/`, `components/dashboard/`, config editor,
  regeneration triggers, lead views.
- **Success criteria:** a tenant edits config → regenerates → previews → sees
  leads, all tenant-scoped; no cross-tenant access; gates green.

## Phase 12 — Billing / Subscriptions / Credits
- **Objectives:** monetize — plans, subscriptions, usage metering (AI
  generations), credits, invoices, provider webhooks.
- **Dependencies:** Auth/Orgs (P10); gates AI generation + Deployment.
- **Complexity:** L
- **Risks:** webhook idempotency + reconciliation; metering accuracy; PCI scope
  (delegate to Stripe); entitlement race conditions.
- **Deliverables:** `lib/billing/`, `app/(billing)/`, plan/entitlement model,
  metering hooks, webhook handlers.
- **Success criteria:** subscribe/upgrade/cancel flow; AI usage metered + gated by
  plan; webhooks idempotent; billing tests pass.

## Phase 13 — Deployment / Custom Domains
- **Objectives:** one-click publish of a generated site to a host + custom domain.
- **Dependencies:** Auth (tenant, P10), Billing (entitlement, P12).
- **Complexity:** XL
- **Risks:** DNS/SSL automation; multi-tenant build isolation + env injection;
  provider rate/lock-in; rollback safety.
- **Deliverables:** `lib/deployment/` (host adapters, domain attach, build
  triggers, status), per-tenant env pipeline.
- **Success criteria:** publish a tenant site to a live URL + custom domain with
  valid SSL; status surfaced in dashboard; safe rollback.

## Phase 14 — Analytics
- **Objectives:** traffic + conversion insight (page views, lead conversions, CTA
  clicks) with privacy-aware aggregation feeding the dashboard.
- **Dependencies:** Auth (tenant scoping, P10), Dashboard (P11); benefits from
  Logging.
- **Complexity:** M
- **Risks:** privacy/consent compliance; event volume/storage; attribution
  accuracy.
- **Deliverables:** `lib/analytics/` (capture + aggregate), dashboard widgets,
  retention policy.
- **Success criteria:** per-tenant views + conversions visible; consent-respecting;
  no measurable performance regression.

---

## Cross-cutting (adopt continuously)
- **Logging / Observability** (`lib/logging/`) — small, highest cross-cutting
  leverage; adopt **before** the SaaS phases so every module is observable.
- **Testing depth** — add component + route/render integration + coverage as each
  phase lands (see `PROJECT_HEALTH.md` — Testing is the weakest category).
- **Infra for scale** — shared rate-limit/cache store (Redis/Upstash) and edge
  CSP/HSTS when going multi-instance.

## Recommended order (value ÷ dependency)
Logging → **P8 Blog** → CRM/lead delivery → **P9 Media** → **P10 Auth** →
**P7 Visual Builder** / **P11 Dashboard** → **P12 Billing** → **P13 Deployment** →
**P14 Analytics**. Phases 7–9 add value with little/no new infra; 10+ build the
multi-tenant SaaS on the Auth foundation.
