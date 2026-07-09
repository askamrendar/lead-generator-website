/**
 * Single source of truth for the public site origin.
 *
 * Every canonical URL, OpenGraph URL, JSON-LD `@id`/`url`, sitemap entry,
 * robots host, and manifest derives from the business config's `siteUrl`, which
 * in turn derives from `NEXT_PUBLIC_SITE_URL` here. Change it in exactly one
 * place (the env var) and the whole generated site follows.
 */

/** Resolve the public origin from env, trimming any trailing slash. */
export function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = raw && raw.length > 0 ? raw : 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/** True for any loopback / non-public origin. */
export function isLocalhostUrl(url: string): boolean {
  return /(^https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);
}

/**
 * Guard a *production* build when the site origin is still localhost — every
 * canonical URL, OG tag, sitemap entry, robots host, and JSON-LD `@id` derives
 * from this origin, so shipping localhost silently breaks SEO.
 *
 * Real deployments must set `NEXT_PUBLIC_SITE_URL`; a demo/CI build may silence
 * the guard with `ALLOW_LOCALHOST_BUILD=1`. Dev (`next dev`) is never flagged.
 *
 * By default this **warns** (so the sample/demo still builds with zero env
 * vars — the project's offline-first contract). Pass `{ strict: true }` to make
 * a misconfigured production build **fail hard** instead; a real deployment
 * pipeline should call it in strict mode. Returns `true` when the origin is a
 * problem (regardless of strict), `false` otherwise.
 */
export function assertProductionSiteUrl(
  url: string,
  opts: { strict?: boolean } = {},
): boolean {
  const isProd = process.env.NODE_ENV === 'production';
  const optOut = process.env.ALLOW_LOCALHOST_BUILD === '1';
  const bad = isProd && isLocalhostUrl(url) && !optOut;
  if (!bad) return false;

  const message =
    '[site] NEXT_PUBLIC_SITE_URL is unset or localhost in a production build. ' +
    'Set NEXT_PUBLIC_SITE_URL to your public https origin (e.g. https://apexplumbing.com), ' +
    'or set ALLOW_LOCALHOST_BUILD=1 to acknowledge a non-production demo build.';
  if (opts.strict) throw new Error(message);
  // Warn at most once per process — the build imports the config from many
  // route workers, and a repeated warning only adds noise.
  if (!warnedLocalhost) {
    warnedLocalhost = true;
    console.warn(`⚠️  ${message}`);
  }
  return true;
}

let warnedLocalhost = false;
