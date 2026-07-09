#!/usr/bin/env node
/**
 * Pre-generate AI content into `.ai-cache/` by calling the running app's batch
 * endpoint. Run against a dev or production server:
 *
 *   npm run start &                 # or: npm run dev
 *   npm run ai:pregenerate          # whole website
 *   AI_SCOPE=matrix npm run ai:pregenerate
 *   AI_REGENERATE=1 npm run ai:pregenerate
 *
 * Env:
 *   BASE_URL       (default http://localhost:3000)
 *   AI_SCOPE       website|core|services|cities|states|counties|zips|neighborhoods|matrix
 *   AI_REGENERATE  set to "1" to force regeneration
 *   AI_LIMIT       optional cap on pages
 */

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const scope = process.env.AI_SCOPE ?? 'website';
const regenerate = process.env.AI_REGENERATE === '1';
const limit = process.env.AI_LIMIT ? Number(process.env.AI_LIMIT) : undefined;

async function main() {
  const url = `${baseUrl.replace(/\/$/, '')}/api/ai/batch`;
  console.log(`→ Pre-generating scope="${scope}" regenerate=${regenerate} via ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, regenerate, limit }),
  });

  if (!res.ok) {
    console.error(`✗ Batch failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const s = data.summary ?? {};
  console.log('✓ Done.');
  console.log(`  pages:    ${s.total ?? 0}`);
  console.log(`  ai:       ${s.ai ?? 0}`);
  console.log(`  fallback: ${s.fallback ?? 0}`);
  console.log(`  errors:   ${s.errors ?? 0}`);
  console.log(`  time:     ${s.durationMs ?? 0}ms`);
  console.log(`  byType:   ${JSON.stringify(s.byType ?? {})}`);
}

main().catch((err) => {
  console.error('✗ Pre-generation error:', err.message);
  console.error('  Is the app running? Start it with `npm run start` or `npm run dev`.');
  process.exit(1);
});
