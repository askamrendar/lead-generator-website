# Testing

## Verification gates (the green-build contract)

Run all four before considering any change done; CI runs the same set
(`.github/workflows/ci.yml`):

```bash
npm run lint         # next lint — zero warnings/errors
npm run type-check   # tsc --noEmit
npm test             # node --test (type-stripped) — 17 cases
npm run build        # next build — 83 routes
```

## Unit tests (`tests/`)

Zero-dependency, using Node's built-in runner (`node --test
--experimental-strip-types`). Tests import the real TypeScript modules by
relative path.

| File | Covers |
| --- | --- |
| `lead.test.mjs` | `leadSchema` validation + honeypot-passes-then-dropped regression |
| `rate-limit.test.mjs` | sliding-window limiter: limit, window reset, per-key isolation |
| `site.test.mjs` | `resolveSiteUrl` trim/default, `isLocalhostUrl`, `assertProductionSiteUrl` warn/strict |
| `cache-freshness.test.mjs` | `isCacheEntryFresh`: promptVersion/status/businessVersion/TTL |

## Guidelines

- Prefer testing **pure logic** (validators, limiter, freshness, URL resolution)
  — no network, no filesystem, deterministic.
- Keep tests dependency-free (`node --test`); do not add a test framework unless
  a real need (component/DOM testing) appears — record that in the
  [decision log](./decision-log.md).
- Pass clocks/inputs explicitly (e.g. `rateLimit(key, cfg, now)`,
  `isCacheEntryFresh(entry, { now })`) so tests avoid wall-clock flakiness.

## SEO / route regression check

After structural changes, diff the build's sitemap URL set and prerendered route
table against a pre-change snapshot; they must be identical unless intended.
