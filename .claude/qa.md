# QA Checklists

> Manual + automated checks per subsystem. Run the relevant list before merging a
> change that touches that area. Pair with `.claude/testing.md` and
> `docs/RELEASE_CHECKLIST.md`.

## Builder
- [ ] `/preview` renders; template/theme/industry/page switches re-compose live.
- [ ] A new block registered in `lib/builder/blocks/registry` renders via `BlockRenderer`.
- [ ] `selectBuild` picks the right template/theme/industry for the business category.
- [ ] Theme tokens apply (no unstyled flash); `ThemeProvider` re-skins subtree.

## SEO
- [ ] Every page has `generateMetadata` (title/description/canonical/OG/Twitter).
- [ ] Canonical/OG origin comes from `NEXT_PUBLIC_SITE_URL` (no hardcoded localhost).
- [ ] Sitemap = expected URL count (66 today); robots allows `/`, disallows `/api/`.
- [ ] `hreflang` + geo meta present on geo pages; `/preview` + `/generate` are `noindex`.

## Routing
- [ ] Every dynamic route has `generateStaticParams`.
- [ ] Route table + sitemap byte-identical to snapshot (unless intended).
- [ ] Special files remain at `app/` root; route groups don't change URLs.

## Rendering
- [ ] `resolvePageContent` never calls a provider at render (read-only).
- [ ] Cache miss/stale → deterministic fallback renders (page never empty).
- [ ] AI cache hit renders repaired content == what the API returns.

## AI
- [ ] With no key: `mock`/deterministic runs; build offline-safe.
- [ ] With a provider: `/api/ai/generate` returns validated+repaired content.
- [ ] Prompt-version bump / config change invalidates cache (freshness rule).
- [ ] `regenerate:true` bypasses cache; rollback restores prior version.

## Schema (JSON-LD)
- [ ] Home has 4 blocks (WebSite, Organization, LocalBusiness, FAQPage).
- [ ] Comparable page types emit consistent schema; no `undefined` fields.
- [ ] Validate in Google Rich Results / schema.org validator for a sample page.

## Accessibility
- [ ] Semantic landmarks; headings ordered; images have alt; forms have labels.
- [ ] Keyboard navigable; visible focus; sufficient contrast (theme tokens).

## Performance
- [ ] SSG/ISR intact; no accidental dynamic rendering of static pages.
- [ ] Images use `next/image` + AVIF/WebP; no layout shift.
- [ ] (Once tooling added) Lighthouse/CWV within budget; bundle size checked.

## API / security
- [ ] Rate limits enforced (`/api/lead` 5/min, etc.); 429 carries `Retry-After`.
- [ ] Admin endpoints fail closed without `ADMIN_API_TOKEN`; constant-time compare.
- [ ] Errors return `{ error }`; no stack/internal leak; JSON parse guarded.

## Deployment (future)
- [ ] `NEXT_PUBLIC_SITE_URL` set to real https origin (build guard passes strict).
- [ ] Env documented in `.env.example`; secrets env-only; CI green.
