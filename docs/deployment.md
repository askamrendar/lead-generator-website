# Deployment

## Today (implemented)

The app is a standard Next.js 15 build with no database or external services
required to run.

```bash
npm ci
NEXT_PUBLIC_SITE_URL="https://yourdomain.com" npm run build
npm run start
```

- **`NEXT_PUBLIC_SITE_URL`** is the single source of truth for canonical URLs,
  OG, sitemap, robots host, and JSON-LD `@id`. Set it to your public https
  origin. A production build on a localhost origin logs a warning (silence with
  `ALLOW_LOCALHOST_BUILD=1` for demo/CI).
- **AI content** is optional and offline-safe. To bake AI copy into static
  pages, run `npm run ai:pregenerate` with a provider configured, then `build`.
- **Env reference:** see `.env.example` (`ADMIN_API_TOKEN`, `RATE_LIMIT_*`, AI
  provider keys).
- **Runtime rate limiting** is per server instance; behind multiple instances,
  back it with a shared store (see [`../SECURITY.md`](../SECURITY.md)).

The matrix routes (`/services/[slug]/[state]/[city]`) use ISR
(`revalidate = 86400`) so the site scales to thousands of combinations.

## Planned — Deployment module (`lib/deployment/`, not yet implemented)

The target architecture reserves a Deployment domain. It is **documented, not
scaffolded** — the folder is created when real code lands (see
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) → Planned future architecture).

- **Purpose:** one-click publish of a generated site to a host + custom domain.
- **Responsibilities:** provider adapters (Vercel/Netlify/static export), domain
  attach + DNS/SSL guidance, build-trigger + status, per-tenant env injection.
- **Dependencies:** business config, auth/orgs (tenant), billing (entitlements).
- **Planned phase:** Phase 14 (see [`../ROADMAP.md`](../ROADMAP.md)).
