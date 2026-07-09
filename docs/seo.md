# SEO Engine (`lib/seo/`, `components/seo/`)

Per-page metadata and JSON-LD, plus sitemap/robots/manifest — all derived from a
single canonical origin.

## Layout

```
lib/seo/
  metadata.ts    buildMetadata(): title/description/canonical/OG/Twitter,
                 geo meta (geo.position/placename/region, ICBM), hreflang (en-US)
  schema.ts      JSON-LD builders: LocalBusiness, Service, serviceInCity, FAQPage,
                 BreadcrumbList, WebSite, Organization, Place/AdministrativeArea/
                 PostalCodeArea, Speakable, ImageObject, Article, review/aggregateRating
components/seo/
  JsonLd.tsx     renders a JSON-LD <script> node (moved here in Phase 6)
app/
  sitemap.ts     66-URL sitemap from getAllPaths
  robots.ts      disallows /api/, exposes host + sitemap
  manifest.ts    web app manifest
```

## Canonical origin — single source of truth

Every canonical URL, OG URL, sitemap entry, robots host, and JSON-LD `@id`
derives from `business.siteUrl`, which derives from `NEXT_PUBLIC_SITE_URL` via
`lib/site.ts` `resolveSiteUrl()`. Set that one env var and the whole site
follows. A production build with a localhost origin warns; enforce a hard failure
with `assertProductionSiteUrl(url, { strict: true })`. (Wired in Phase 5.5.)

## Invariants to preserve

When changing routes or the builder, the sitemap URL set and prerendered route
table must stay identical unless the change is intentional. The Phase-6
restructure was verified to keep both **byte-identical** (66 URLs, 71 routes).
