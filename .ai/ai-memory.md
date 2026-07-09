# AI Memory — Durable Notes

Non-obvious facts a future session should know. Keep short; delete when stale.

- **Alias is root-relative** (`@/*` → repo root). Moving any folder requires a
  global rewrite of `@/oldpath` → `@/newpath` **including self-references inside
  the moved folder**. Always `type-check` immediately after a move.
- **Two cache readers, one rule.** `lib/ai/render.ts` (read) and
  `lib/ai/services/content-service.ts` (write) both go through
  `lib/ai/cache/freshness.ts`. Never add a third freshness check — extend that.
- **Site origin has exactly one source:** `lib/site.ts` `resolveSiteUrl()` (env
  `NEXT_PUBLIC_SITE_URL`). Do not read `NEXT_PUBLIC_SITE_URL` directly elsewhere.
- **Build warns on localhost origin by design** (not a failure). CI sets
  `ALLOW_LOCALHOST_BUILD=1`. Real deploys set `NEXT_PUBLIC_SITE_URL`.
- **Tests are dependency-free** (`node --test --experimental-strip-types`, Node
  22.18+). They import real `.ts` by relative path; keep pure-logic focus.
- **SEO invariant:** after structural changes, diff the build's sitemap URL set
  (66) and prerendered route table (71) against a snapshot — must match unless
  intended.
- **Do not scaffold unbuilt modules.** Future domains are documented in
  `ARCHITECTURE.md`; create a folder only when it holds real code.
