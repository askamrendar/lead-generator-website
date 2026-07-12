# Progress — Completed & Current Milestones

> This file supplements **`PROJECT_MEMORY.md`**. `PROJECT_MEMORY.md` (project root) is the
> canonical project memory — read it first. History below is preserved for reference.

> Status legend: ✅ Completed · 🔄 In Progress · ⏳ Pending · ⛔ Blocked.
> Canonical release detail: [`CHANGELOG.md`](../CHANGELOG.md). Roadmap:
> [`ROADMAP.md`](../ROADMAP.md). Update this file whenever a phase changes state.

## Timeline

| Phase | Milestone | Version | Status |
| --- | --- | --- | --- |
| Core | Generator Core | 0.1.0 | ✅ |
| SEO | Nationwide SEO Generator | 0.2.0 | ✅ |
| AI-1 | AI Content Engine | 0.3.0 | ✅ |
| AI-2 | AI Rendering Engine | 0.4.0 | ✅ |
| Builder | Website Builder (Template + Block Engine) | 0.5.0 | ✅ |
| Hardening | Production Hardening | 0.5.1 | ✅ |
| Restructure | Enterprise Restructure | 0.6.0 | ✅ |
| **7.1** | **SaaS Foundation (Auth + DB + Multi-tenancy)** | 0.7.0-alpha | ✅ **Production Approved** |
| 7.2 | Visual Builder (live editor UI) | 0.7 (planned) | ⏳ |

## ✅ Generator Core (0.1.0)
`BusinessConfig` Zod schema + selectors; home/about/contact; `/services/[slug]`;
`/locations/[state]/[city]`; `/generate` intake + `/api/generate`; deterministic
content engine; sitemap/robots/manifest; sample business (Apex Plumbing Co.).

## ✅ Nationwide SEO Generator (0.2.0)
Geo taxonomy (counties/ZIPs/neighborhoods, nearby selectors); service×city matrix
(ISR); internal link engine + `RelatedLinks`; expanded JSON-LD (serviceInCity,
Place/AdministrativeArea/PostalCodeArea, Speakable, ImageObject, Article); geo meta
+ hreflang. Sitemap grew 24 → 66 URLs.

## ✅ AI Content Engine (0.3.0)
Provider-agnostic (`openai`/`anthropic`/`gemini`/`openrouter`/`mock`), env-selected;
versioned prompt library; file+memory cache; content-service orchestrator with
retry/rate-limit + deterministic fallback; 18 agents; image-prompt + blog generators;
`/api/ai/generate`.

## ✅ AI Rendering Engine (0.4.0)
`resolvePageContent` (cache-first, read-only, never blocks); validation + repair;
cache metadata (status/businessVersion/ttl/hash); versioning + rollback; batch
generation + `scripts/pregenerate.mjs`; expanded `/api/ai/*`. All content pages wired.

## ✅ Website Builder (0.5.0)
8 themes + `ThemeProvider`; 22 blocks + `BlockRenderer`; 5 industry packs; 4 templates
(inheritance); `composePage`; heuristic + `aiSelectBuild`; registries; live `/preview`.

## ✅ Production Hardening (0.5.1)
Single-source site origin + build guard; `/api/lead` rate limiting + honeypot fix;
unified cache freshness (`isCacheEntryFresh`); consistent API error shape
(`serverError`); admin-gated cache read; `SECURITY.md`; env docs; first test suite
(17 `node --test` cases). Tag `v0.5.1`.

## ✅ Enterprise Restructure (0.6.0)
`themes/` + `industries/` promoted to repo root; `LeadForm`→`components/forms`,
`JsonLd`→`components/seo`; `ARCHITECTURE.md`, `docs/`, `.github/` (CI), `.ai/`;
future modules documented not scaffolded; routes/SEO verified byte-identical.
Release baseline merged to `main` (commit `cf1cff1`), `stable/v0.6.0` cut. Tag `v0.6.0`.

## ✅ Phase 7.1 — SaaS Foundation (Auth + DB + Multi-tenancy)
**Resequence:** Auth/DB (formerly "Phase 10" / task `T-020`) was pulled forward by
explicit instruction as **Phase 7.1**; the Visual Builder becomes **Phase 7.2**
(history preserved). **Delivered:**
- **Auth.js v5** (`next-auth@5.0.0-beta.31`) — Credentials (scrypt via `node:crypto`)
  + conditional Google/GitHub OAuth; **JWT** sessions; Edge/Node config split
  (`lib/auth/config.ts` edge-safe → `middleware.ts`; `lib/auth/auth.ts` Node).
- **Prisma 6.19.3 + PostgreSQL**: `prisma/schema.prisma` (14 models), initial
  migration SQL, `lib/db/prisma.ts` singleton; **Docker** dev DB (`docker-compose.yml`),
  **Neon** production documented in `.env.example`.
- **Tenancy:** `Organization → Workspace → Project → Website` (+ `WorkspaceSettings`,
  `Membership`, `Team`/`TeamMembership`/`TeamInvitation`); **RBAC** (`permissions/roles`
  + `rbac`); new-user auto-provisioning (org + default workspace + OWNER membership).
- **Flows/APIs:** register, login/logout (Auth.js), email-verification + password-reset
  architecture (token models + endpoints + `lib/auth/email.ts` dev-log seam),
  `middleware` route guard for reserved `/dashboard`,`/app`.
- **Isolation:** auth lives entirely in `lib/auth/` + `lib/db/`; **zero** auth logic in
  the Builder/AI/SEO engines; the `Website` model references engine artifacts by id/value.
- **Verified:** `lint` / `type-check` / `test` (40 pass) / `build` (exit 0) all green;
  **sitemap invariant 66 URLs preserved**. Live DB migration is developer-run.
**Not built (per scope):** dashboard/login UI, billing, deployment providers, CRM, blog,
admin, `Deployment`/`Domain` tables — future milestones.

**Architecture verification (2026-07-10):** senior review + production hardening.
Scores — Architecture 9 · **Production Readiness 9** · Security 9 · Scalability 6 ·
Maintainability 9 · Extensibility 9. Hardening applied: **H1** Auth.js `trustHost`
(env `AUTH_TRUST_HOST`, secure prod default) + **M1** enumeration-safe registration
(generic success; collisions logged only). All four gates green. **Verdict: ✅
Production Approved for Phase 7.2.** Tracked follow-ups (not blockers): tenant-access
guard (T-035, 7.2 foundation), shared rate-limit store (T-032), apply/verify live
migration, email provider, `emailVerified` login policy. See ADR-0007.

## 🔄 Phase 7.2 — Authenticated product surface + Visual Builder (in progress)
Sub-milestones (verify + stop + present after each): **7.2.0** Tenant Access Guard ✅ →
**7.2.1** Auth UI ✅ → **7.2.2** Dashboard Foundation ✅ → **7.2.3** Website Manager ✅ →
**7.2.4** AI Website Generator → **7.2.5** Visual Builder → Production Route Adoption. Detail:
[`.claude/roadmap.md`](roadmap.md) (§ v0.7), [`NEXT_RELEASE_PLAN.md`](../NEXT_RELEASE_PLAN.md).

### ✅ Dashboard Redesign (product-quality pass, on 7.2.2/7.2.3 surfaces)
Reuse-first upgrade toward a Vercel/Linear feel on the existing design system (no new
deps): action-oriented **home** (real counts + recent websites + honest placeholders),
**command palette ⌘K** (`lib/search/`, tenant-scoped website search), **Settings** split
into 11 sections, full **Website Manager** action set, wizard **entry modes** (Manual/
Import/Google Business Profile; AI auto-fill deferred to 7.2.4), and **Deployment/Domain
UI shells** (no logic). Gates green (test **76/76**); **SEO/sitemap(66)/JSON-LD(4) unchanged**.

### ✅ 7.2.3 — Website Manager
Create/organize/manage websites (not content editing — Builder stays separate). Website
is the central aggregate (schema extended: language/timezone/businessConfig/archivedAt,
migration 0002). `lib/websites/` service — **every op via the tenant-access layer** —
+ pure `schema`/`status` (tested). UI: filterable list + per-row actions (rename/duplicate/
archive/restore/delete), 6-step creation **wizard (config only, no generation)**, and a
website-detail shell with config-driven tabs (Overview + Settings live; Builder/AI/Pages/
SEO/Deployments/Domains/Media/Analytics/Versions placeholders). Gates green (test **73/73**),
sitemap **66** preserved. **Next: 7.2.4 AI Website Generator (awaiting approval).**

### ✅ 7.2.2 — Dashboard Foundation
The permanent app shell every future module inherits. `components/dashboard/`
(`DashboardLayout`/`DashboardShell` responsive sidebar+drawer+header, `SidebarNav`
config-driven, `Breadcrumbs`, org/workspace switchers, `UserMenu`, notifications
placeholder) + `app/dashboard/` (home with stat cards + 10 placeholder routes). New
generic `components/ui/*` (dropdown, modal/drawer, confirm-dialog, data-table, empty-state,
page-header, stat-card, action-menu, search-input, filter-bar, pagination, skeleton,
loading-overlay, error-boundary). `lib/dashboard/` (nav config, context loader, switch
actions **validated via the tenant-access layer**). Consumes Auth/Authorization/Tenant
Access — no duplication. Gates green (test **63/63**), sitemap **66** preserved.
**Next: 7.2.3 Website Manager (awaiting approval).**

### ✅ 7.2.1 — Authentication Experience
Complete auth UI over the 7.1 APIs: pages `app/(auth)/{login,register,forgot-password,
reset-password,verify-email,logout,invitations/[token]}` + `AuthLayout`; components
`components/auth/*` (forms, `PasswordField`/strength meter, `OAuthButtons`, `RememberMe`,
`FormField`, `LoadingButton`, `AuthCard`); dependency-free toast + dark-mode toggle;
`SiteChrome` hides marketing chrome on app routes (marketing SSR unchanged). Added
`POST /api/auth/accept-invitation` (invite creation is Phase 9). Google/GitHub (when
configured), remember-me, a11y, open-redirect-safe callbacks. Gates green (test **63/63**),
sitemap **66** preserved. **Next: 7.2.2 Dashboard Foundation (awaiting approval).**

### ✅ 7.2.0 — Authorization & Tenant Access Foundation
Centralized authorization layer `lib/auth/access/` — the **single supported way** to
access tenant resources (`T-035`). Pure decision core (`engine`/`errors`/`context`,
fully unit-tested) + Node resolver (`require{Organization,Workspace,Project,Website}Access`
via a `defineResourceAccess` registry) + `*Scope` tenant-filter helpers + `AccessError`
taxonomy (tenant-hiding, fail-closed) + `accessErrorResponse` HTTP mapping. Removed the
duplicate `requireOrgPermission` from `session.ts`. Gates green (test **57/57**); sitemap 66
preserved. **Next: 7.2.1 (awaiting approval).**
**Status:** branch `feature/phase-7-visual-builder`.

## Pending / not started (documented, not scaffolded)
Blog pages · Media/Image engine · Dashboard · Billing · Deployment providers ·
Analytics · Logging · white-label/marketplace/plugins. See
`.claude/future-features.md`, `ARCHITECTURE.md` §2.
*(Auth & multi-tenancy now built — Phase 7.1.)*

## ⛔ Blocked
Nothing hard-blocked. The **Auth + database** critical path is now unblocked
(Phase 7.1) — Dashboard/Admin/Billing/Deployment/CRM persistence can build on it.
