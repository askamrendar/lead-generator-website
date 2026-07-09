# Project — Vision, Mission, Business

## Vision
Make a professional, SEO-dominant local-business website a **one-config** artifact:
any local service business gets a complete, structured, lead-generating site — and,
over time, a self-serve SaaS that generates, hosts, and optimizes it end to end.

## Mission
Turn a single validated `BusinessConfig` into a full nationwide site — homepage,
service pages, a service×city matrix, location hubs (state/county/city/ZIP/
neighborhood), blog-ready content, lead capture, and complete metadata + JSON-LD —
with optional provider-agnostic AI copy and an offline-safe deterministic fallback.

## Business goals
1. **Generation quality:** sites that rank (unique per-page copy, geo taxonomy,
   full schema, internal-link engine) — implemented.
2. **Breadth:** many industries/themes/templates from small additive files.
3. **Self-serve SaaS:** intake → generate → preview → publish, multi-tenant.
4. **Monetization:** subscriptions + usage credits (AI generations).

## Target users
- **Local service businesses** — plumbing, HVAC, roofing, electrical, and adjacent
  trades (the industry packs today).
- **Agencies / resellers** — spin up many client sites from configs (white-label
  is a future feature).

## Value proposition
- An entire, SEO-optimized, schema-rich, block-driven site from **one form**.
- **Nationwide** location coverage via a geo taxonomy + ISR matrix that scales to
  thousands of pages.
- **AI-optional:** deterministic content runs offline; a provider key upgrades copy
  with **no page/SEO code changes**.
- **Themeable/industry-aware** via swappable themes, blocks, industry packs, templates.

## Competitors / landscape
- DIY site builders (Wix/Squarespace/Webflow) — general-purpose, not local-SEO-first
  or config-generated at scale.
- Local-SEO/agency page builders and "rank-and-rent" tools — often thin/spammy;
  this project's differentiator is unique-per-page content + full structured data +
  a real component/theme engine.
- Positioning: **programmatic, schema-complete, industry-aware local sites** with an
  AI content layer and (planned) self-serve SaaS + deployment.

## Long-term roadmap (summary — full: `.claude/roadmap.md`, `ROADMAP.md`)
Visual Builder → Blog pages → Media/Image engine → Auth/multi-tenancy → Dashboard →
Billing → Deployment/custom domains → Analytics → white-label/marketplace/plugins.

## Success metrics
- **Product:** build stays green; routes/SEO invariants preserved; per-page content
  uniqueness; schema validity; Lighthouse/Core Web Vitals (once measured).
- **SaaS (future):** time-to-first-site, sites generated, AI generations metered,
  publish success rate, tenant retention, revenue per tenant.
- **Engineering:** test coverage growth, zero circular deps, low technical debt,
  documentation coverage (currently high).

## Current status
v0.6.0 baseline: generation engine feature-complete and production-hardened;
enterprise architecture + docs in place. SaaS layers (auth/dashboard/billing/
deployment) are **documented, not built** — see `.claude/future-features.md`.
