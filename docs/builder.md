# Website Builder — Template / Block / Theme / Industry Engine

Any business renders as a themed, JSON/block-driven site. Pages are composed from
ordered block definitions, rendered under a swappable theme, driven by industry
packs. Demonstrated live at `/preview`.

## Layout (post Phase-6 restructure)

```
lib/builder/
  types.ts        BlockInstance, PageDefinition, BlockContext, ThemeTokens, IndustryPack, Template
  blocks/         block registry + BlockRenderer wiring
  compose.ts      composePage(template, pageType) → PageDefinition
  select.ts       selectBuild (heuristic) + aiSelectBuild (provider-driven, fallback-safe)
  context.ts      buildBlockContext
  registry/       aggregate section/component/theme/industry/template/generator registries
themes/           8 CSS-variable themes + ThemeProvider tokens        (moved to repo root)
industries/       5 industry packs (plumbing/hvac/roofing/electrical/generic)  (moved to repo root)
templates/        base, plumber, hvac, generic (JSON layouts + inheritance) + registry
components/
  blocks/         22 configurable, theme-/industry-aware blocks
  builder/        BlockRenderer, ThemeProvider (React)
```

**Phase 6 note:** `themes/` and `industries/` were promoted from
`lib/builder/*` to the repo root — they are first-class, reusable domains (the
target structure lists them top-level), imported via `@/themes` and
`@/industries`. `lib/builder/types.ts` remains the shared contract they depend on.

## Flow

```
business
  → selectBuild(business)                → { template, theme, industry }
  → composePage(template, pageType)      → PageDefinition (ordered blocks)
  → buildBlockContext + resolvePageContent (AI render pipeline)
  → <ThemeProvider><BlockRenderer/></ThemeProvider>
```

## Extending

- **New theme:** add a token file under `themes/` and register it in
  `themes/registry`.
- **New industry:** add a pack under `industries/` and register it in
  `industries/registry`.
- **New template:** add a JSON layout under `templates/` (inherits from `base`)
  and register it in `templates/registry`.
- **New block:** add a component under `components/blocks/` and register it in
  `lib/builder/blocks/registry`.

Registries are the single wiring point — no page hardcodes a layout.
