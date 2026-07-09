# AI Content & Rendering Engine (`lib/ai/`)

Provider-agnostic content generation with a **read-only, cache-first render
pipeline** and a deterministic offline fallback. The site always renders — with
or without a provider key.

## Layout

```
lib/ai/
  config.ts            env-driven provider/model/temperature selection
  providers/           openai, anthropic, gemini, openrouter, mock (+ factory)  — fetch-based
  prompts/             versioned page/field/blog templates (PROMPT_LIBRARY_VERSION)
  cache/               file + memory stores, stable keys, freshness rules
  services/            content-service (orchestrator), deterministic fallback,
                       image-prompts, blog generators, retry, rate-limit
  agents/              18 reusable content agents + registry
  context.ts           PageContext builders per page type
  render.ts            resolvePageContent() — cache-first, never calls a provider
  validation.ts        validate + repair (completeness, dedupe)
  versioning.ts        draft/published/archived + history + rollback
  generation.ts        enumerate contexts + batch generation by scope
  hash.ts              business-config + content hashing
```

## Two paths, one freshness rule

- **Render (read):** `render.ts` `resolvePageContent(ctx)` reads the cache,
  checks freshness, repairs, and returns AI content — or the deterministic
  fallback on miss/stale/error. It **never** calls a provider or writes, so
  rendering can't block or incur cost.
- **Generate (write):** `services/content-service.ts` `generatePageContent(ctx)`
  is the only path that calls a provider. On a fresh cache hit it short-circuits;
  otherwise it prompts, validates, merges the AI draft over the deterministic
  baseline, **repairs**, and caches.

Both readers share **one** freshness predicate — `cache/freshness.ts`
`isCacheEntryFresh()` (promptVersion + status + businessVersion + TTL) — so a
config change or prompt-version bump invalidates identically on both sides. This
was unified during Phase 5.5 (see [decision-log](./decision-log.md)).

## Enabling live AI

Set `AI_PROVIDER` + the matching key (see `.env.example`). With no key the
engine runs the `mock`/deterministic provider. Pre-generate before a build so AI
content is baked into static pages:

```bash
AI_PROVIDER=openai OPENAI_API_KEY=... npm run ai:pregenerate
npm run build
```

## API

`app/api/ai/*` exposes generate / regenerate / status / cache (list/history/
delete/rollback) / batch / provider / prompts. See [api.md](./api.md) for auth
and rate limits.
