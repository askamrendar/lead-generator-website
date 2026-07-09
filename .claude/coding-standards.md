# Coding Standards

> Concrete conventions. Match the surrounding code first; these codify the norm.
> Enforced by ESLint + Prettier + strict TS (`.eslintrc.json`, `.prettierrc.json`,
> `tsconfig.json`). See also `docs/contributing.md`.

## Imports & aliases
- **Root alias `@/*` → repo root** (`tsconfig.json`). Import by top-level domain:
  `@/lib/ai`, `@/lib/builder`, `@/themes`, `@/industries`,
  `@/components/{ui,layout,builder,blocks,forms,seo,site}`, `@/data/business`.
- Moving a folder = **global alias rewrite** of `@/oldpath` → `@/newpath`, **including
  self-references inside the moved folder**. Always `type-check` immediately after.
- Prefer type-only imports (`import type { … }`) for types.

## Naming
- Components: `PascalCase.tsx` (e.g. `BlockRenderer.tsx`). Hooks: `useX`.
- Libs/utilities: `kebab-case.ts` or domain names (`rate-limit.ts`, `content.ts`).
- Registries: `registry.ts`; barrels: `index.ts`. Types: `types.ts`.
- Env vars: `SCREAMING_SNAKE_CASE`; public ones prefixed `NEXT_PUBLIC_`.

## TypeScript
- `strict` on; no `any` (use `unknown` + narrowing). Let Zod `infer` types from schemas.
- Exhaustive `switch` on unions; return typed results, not loose objects.

## React / Next.js (App Router)
- **Server Components by default.** Add `'use client'` only when interactivity/hooks
  are required (e.g. `LeadForm`, `/generate`, `/preview` controls).
- Special files stay at `app/` root: `layout.tsx`, `globals.css`, `sitemap.ts`,
  `robots.ts`, `manifest.ts`, `not-found.tsx`. Every dynamic route has
  `generateStaticParams`; use route groups `(name)` for URL-transparent grouping.
- Metadata via `generateMetadata` + `lib/seo/metadata.ts`; JSON-LD via
  `components/seo/JsonLd.tsx`. Don't hardcode canonical/OG.

## API routes
Pattern (see `docs/api.md`, `lib/api/security.ts`):
1. `export const runtime = 'nodejs'`.
2. `enforceRateLimit(...)` first; `requireAdmin(...)` for mutating/admin reads.
3. Guard `request.json()` → 400 on parse failure.
4. Validate with Zod → 422 `error.flatten()`.
5. Wrap core logic in `try/catch` → `serverError(context, err)` (uniform `{error}`,
   logged server-side, never leaks internals).

## Validation
- All external input validated with **Zod** at the boundary; schemas live next to
  their domain (`lib/forms/*`, `lib/generator/schema.ts`, `lib/ai/validation.ts`).

## Error handling & logging
- User-facing errors: consistent `{ error }` shape; never leak stack/internal detail.
- Server logs: `console.info/warn/error` today (a `lib/logging/` abstraction is
  planned — T-001). Don't add noisy logs; dedupe build-time warnings.

## Comments & docs
- Comment the **why**, not the what. Keep block comments where behavior is subtle
  (e.g. honeypot, cache freshness, site-URL guard). Match existing comment density.

## Formatting
- Prettier + `prettier-plugin-tailwindcss` (`npm run format`). 2-space indent, single
  quotes, trailing commas. Don't hand-fight the formatter.

## Prompts (AI)
- Prompt strings live only in `lib/ai/prompts/` and are versioned by
  `PROMPT_LIBRARY_VERSION`. Business/render logic looks up a template — never inlines one.
