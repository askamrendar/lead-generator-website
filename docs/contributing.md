# Contributing

## The green-build contract

Every change must keep all four gates green — run them before and after your work
(CI enforces the same):

```bash
npm run lint && npm run type-check && npm test && npm run build
```

Never commit or continue on a failing gate.

## Conventions

- **Imports:** root alias `@/*` (see `tsconfig.json`). Reference domains by their
  top-level path — `@/lib/ai`, `@/lib/builder`, `@/themes`, `@/industries`,
  `@/components/{ui,layout,builder,blocks,forms,seo,site}`.
- **Separation of concerns:** prompts live in `lib/ai/prompts`, never in business
  logic; SEO builders in `lib/seo`; validation schemas next to their domain
  (`lib/forms`, `lib/generator/schema.ts`, `lib/ai/validation.ts`).
- **Single source of truth:** the site origin comes only from `lib/site.ts`; the
  business config only from `data/business.ts`; cache freshness only from
  `lib/ai/cache/freshness.ts`.
- **No dead scaffolding:** do not create a folder until it holds real,
  maintained code. Future modules are documented in `ARCHITECTURE.md` and created
  when their phase begins.

## New module workflow

1. Confirm the target folder + phase in `ARCHITECTURE.md` (Planned future
   architecture) and `ROADMAP.md`.
2. Create the folder **with real code**, wire it via the relevant registry or
   route, and add tests.
3. Update `ARCHITECTURE.md` (move the module from planned → implemented),
   `PROJECT_MANIFEST.md`, `ROADMAP.md`, `CHANGELOG.md`, and add a `docs/` page.
4. Record any non-obvious architectural choice in
   [decision-log.md](./decision-log.md).

## Git

The maintainer controls commits, tags, and pushes. Do not push or open releases
without explicit approval.
