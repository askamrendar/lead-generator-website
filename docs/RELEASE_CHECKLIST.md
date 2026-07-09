# Release Checklist — v0.6.0

Run before tagging/publishing any release. Status reflects the **v0.6.0**
release-candidate verification (2026-07-10).

## Quality gates

| # | Item | Command / evidence | v0.6.0 |
| --- | --- | --- | --- |
| 1 | **TypeScript** | `npm run type-check` → `tsc --noEmit` clean | ✅ |
| 2 | **ESLint** | `npm run lint` → no warnings/errors | ✅ |
| 3 | **Tests** | `npm test` → 17/17 passing | ✅ |
| 4 | **Production build** | `npm run build` → compiled successfully | ✅ |
| 5 | **Routes** | 83 routes (71 prerendered) compile | ✅ |
| 6 | **Sitemap** | `/sitemap.xml` → 66 `<loc>` URLs | ✅ |
| 7 | **Robots** | `/robots.txt` → Allow `/`, Disallow `/api/`, host + sitemap | ✅ |
| 8 | **Metadata** | `<title>`, canonical, OG/Twitter render in built HTML | ✅ |
| 9 | **JSON-LD** | 4 blocks/page (WebSite, Organization, LocalBusiness, FAQPage) | ✅ |

## Documentation

| # | Item | v0.6.0 |
| --- | --- | --- |
| 10 | `README.md`, `PROJECT_MANIFEST.md`, `ROADMAP.md`, `CHANGELOG.md` current | ✅ |
| 11 | `ARCHITECTURE.md`, `SECURITY.md`, `docs/`, `.ai/` present | ✅ |
| 12 | `PROJECT_HEALTH.md`, `NEXT_RELEASE_PLAN.md` present | ✅ |
| 13 | CHANGELOG has a dated `[0.6.0]` entry | ✅ |

## Release engineering

| # | Item | Notes | v0.6.0 |
| --- | --- | --- | --- |
| 14 | **Git tag** | `v0.6.0` → `02a7690` (Phase 6 commit) | ✅ exists |
| 15 | **Branches** | `main`, `develop`, `release/v0.6.0`, `feature/*` | ✅ |
| 16 | **`main` at release** | merge `release/v0.6.0` → `main` (**pending maintainer approval**) | ⏳ |
| 17 | **Stable snapshot** | `stable/v0.6.0` from `main` after merge | ⏳ |
| 18 | **Local backup** | `LeadGeneratorWebsite-v0.6.0.zip` beside project + verified | ✅ |
| 19 | **GitHub Release** | notes drafted (`docs/RELEASE_NOTES_v0.6.0.md`); **not published** | ⏳ prepared |
| 20 | **Branch protection** | protect `main` (require CI + review) — GitHub UI, maintainer | ☐ manual |
| 21 | **Backup verified** | `unzip -t` integrity check passes | ✅ |

Legend: ✅ done · ⏳ prepared/awaiting approval · ☐ manual step for maintainer.

## Sign-off

- Verified by: release engineer (automated gates) — 2026-07-10
- All quality gates green; remote push and GitHub Release publication are gated on
  explicit maintainer approval (see `PROJECT_MANIFEST.md`).
