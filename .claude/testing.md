# Testing Strategy

> Canonical: [`docs/testing.md`](../docs/testing.md). This adds strategy + gaps.
> Testing is the weakest health category (5/10, `PROJECT_HEALTH.md`) — grow it as
> new surfaces land.

## The four gates (green-build contract; CI runs the same)
```
npm run lint         # next lint — zero warnings/errors
npm run type-check   # tsc --noEmit
npm test             # node --test (type-stripped) — 17 cases
npm run build        # next build — 83 routes
```

## Unit tests — today (`tests/`, zero-dependency `node --test`)
| File | Covers |
| --- | --- |
| `lead.test.mjs` | `leadSchema` + honeypot-passes-then-dropped regression |
| `rate-limit.test.mjs` | sliding-window limiter: limit, window reset, per-key isolation |
| `site.test.mjs` | `resolveSiteUrl` trim/default, `isLocalhostUrl`, `assertProductionSiteUrl` |
| `cache-freshness.test.mjs` | `isCacheEntryFresh`: promptVersion/status/businessVersion/TTL |

Principles: pure logic, deterministic (pass clocks/inputs explicitly), no network/FS,
no test framework dependency. Import real `.ts` by relative path.

## Integration / build verification
- **Build** proves all 83 routes compile and prerender.
- **Route/SEO regression:** diff the built sitemap URL set (66) and prerendered route
  table (71) against a snapshot; must match unless intended. Home page must carry 4
  JSON-LD blocks.

## Gaps (priority backlog — see T-002)
- ❌ Component/DOM tests (blocks, LeadForm, ThemeProvider).
- ❌ Route/render integration (does a given page type render expected content/schema?).
- ❌ E2E (intake → generate → preview; lead submit → 200/422/429/502).
- ❌ Coverage reporting in CI.
- ❌ Performance (Lighthouse/CWV), accessibility (axe), bundle-budget checks.

## When adding features
- Add pure-logic unit tests for new validators/engines.
- Add a render/route smoke test for new page types (assert metadata + JSON-LD present).
- For API routes, test 400/422/429/502 paths and the happy path.
- Keep the freshness/limiter/site invariants covered as they evolve.
- If you introduce a test framework (component/e2e), record it in `.claude/decisions.md`
  and wire it into `.github/workflows/ci.yml`.
