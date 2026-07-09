# Future SaaS Features

> **Documented, not scaffolded.** No folder or stub exists for these until real code
> lands. Full engineering detail: [`ARCHITECTURE.md`](../ARCHITECTURE.md) §2 and
> [`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md). Phase numbers here follow
> `NEXT_RELEASE_PLAN.md`.

Each entry: **Purpose · Location (when built) · Depends on · Phase.**

## Authentication & Organizations
Accounts, sessions, orgs/teams, RBAC; tenant-scope every business config. The
**critical-path unlock** for all SaaS surfaces. · `lib/auth/`, `app/(auth)/`, DB
(Prisma+Postgres) · none upstream · **P10**.

## Customer Dashboard
Authenticated UI: config CRUD, AI regeneration, preview, publish status, lead inbox.
· `app/dashboard/`, `components/dashboard/` · Auth · **P11**.

## Admin Console
Operator surface across tenants: user/tenant mgmt, content/cache oversight (wraps
`/api/ai/*`), usage + health. · `app/admin/`, `lib/admin/` · Auth (elevated) · **P11**.

## Billing / Subscriptions / Credits
Plans, subscriptions, usage metering (AI generations), credits, invoices, webhooks
(Stripe). Gates AI + Deployment. · `lib/billing/`, `app/(billing)/` · Auth · **P12**.

## CRM / Lead Pipeline
Implement the `app/api/lead` delivery seam: persistence, CRM/email/SMS adapters,
dedupe, status, export. Extends `lib/leads/`. · `lib/crm/` · DB, Auth · **P10 (completion)**.

## Media Library / Image Generation
Turn `lib/ai/services/image-prompts.ts` into real optimized assets + alt text;
storage/CDN; first assets create `public/`. · `lib/media/`, `public/` · image provider,
storage · **P9**.

## Blog Engine (pages)
Publish existing blog generators as routes: article/category/tag, RSS, Article
JSON-LD, topic-cluster links. No new infra. · `app/blog/`, `lib/blog/` · AI+SEO
(exist) · **P8**.

## Deployment / Custom Domains
One-click publish + domain attach: host adapters (Vercel/Netlify/static export),
DNS/SSL, build triggers, per-tenant env. · `lib/deployment/` · Auth, Billing · **P13**.

## Analytics
Traffic + conversion insight (views, lead conversions, CTA clicks), privacy-aware,
feeds dashboard. · `lib/analytics/` · Auth, Dashboard · **P14**.

## Logging / Observability (cross-cutting)
Structured logs, metrics, error tracking; replace ad-hoc `console.*`. Adopt early.
· `lib/logging/` · none · **continuous** (T-001).

## Beyond v1.0 (vision — not yet planned in detail)
- **Multi-tenancy hardening** (per-tenant isolation, quotas, data residency).
- **White-label / reseller** (custom branding/domains per agency).
- **Template marketplace** (share/sell themes, blocks, industry packs, templates).
- **Plugin system** (third-party blocks/integrations via a stable extension API).
- **Team collaboration** (roles, review/approval, comments, audit trail).

## Rule
When any of these begins: create the folder **with real code**, wire it via the
relevant registry/route, add tests, and move it from "planned" → "implemented" in
`ARCHITECTURE.md`, `.claude/progress.md`, `PROJECT_MANIFEST.md`, `ROADMAP.md`,
`CHANGELOG.md`.
