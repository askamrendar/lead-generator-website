import { loadSiteBundle, websiteRoutes } from '@/lib/websites/render-service';
import { zipStore, type ZipEntry } from '@/lib/export/zip';
import { faviconSvg } from '@/lib/export/favicon';
import { getTheme } from '@/themes/registry';
import { logger } from '@/lib/logger';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Static-site ZIP export. Every page of the website is rendered by the SAME
 * pipeline that serves it live — the export self-fetches `/sites/<id>/<path>?static=1`
 * (which swaps interactive blocks for no-JS-safe equivalents) and post-processes
 * the HTML into a standalone document:
 *   - Next.js runtime <script>s removed (the exported site ships zero JS)
 *   - the compiled Tailwind stylesheet inlined into the archive (assets/site.css)
 *   - `/_next/image` optimizer URLs unwrapped back to their source images
 *   - `/sites/<id>` link prefixes rewritten to site-root-relative
 * plus robots.txt, sitemap.xml, and a deterministic SVG favicon.
 *
 * Rendering through the live route (not a parallel renderer) guarantees the
 * export matches the hosted site block-for-block.
 */

export interface StaticExportResult {
  bytes: Uint8Array;
  fileName: string;
  pages: number;
}

/** "/" → "index.html", "/about" → "about/index.html" (pretty URLs on static hosts). */
function htmlPathFor(routePath: string): string {
  if (routePath === '/') return 'index.html';
  return `${routePath.replace(/^\/+/, '')}/index.html`;
}

/** The compiled Tailwind stylesheet from the production build (best-effort). */
async function loadStylesheet(): Promise<string> {
  try {
    const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
    const files = (await fs.readdir(cssDir)).filter((f) => f.endsWith('.css'));
    if (files.length > 0) {
      const sheets = await Promise.all(
        files.map((f) => fs.readFile(path.join(cssDir, f), 'utf8')),
      );
      return sheets.join('\n');
    }
  } catch {
    // dev server: no build CSS on disk — fall through
  }
  logger.warn('static export: build CSS not found, using minimal base sheet');
  return [
    'body{margin:0;font-family:system-ui,-apple-system,sans-serif;line-height:1.6;}',
    '.container{max-width:72rem;margin:0 auto;padding:0 1rem;}',
  ].join('\n');
}

/** Unwrap `/_next/image?url=<encoded>&…` back to the underlying image URL. */
function unwrapNextImages(html: string): string {
  return html.replace(
    /\/_next\/image\?[^"'\s>]*url=([^&"'\s>]+)[^"'\s>]*/g,
    (_m, enc: string) => {
      try {
        return decodeURIComponent(enc);
      } catch {
        return '';
      }
    },
  );
}

/** Strip Next runtime scripts/preloads — but KEEP JSON-LD structured data. */
function stripNextRuntime(html: string): string {
  return html
    .replace(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/g, '')
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/g, (m, attrs: string) =>
      /type="application\/ld\+json"/.test(attrs) ? m : '',
    )
    .replace(/<link\b[^>]*rel="(?:preload|prefetch|modulepreload|manifest)"[^>]*>/g, '');
}

/** Replace the built stylesheet link(s) with the archive-local stylesheet. */
function relinkStylesheet(html: string, depth: number): string {
  const prefix = '../'.repeat(depth);
  const local = `<link rel="stylesheet" href="${prefix}assets/site.css"/>`;
  let replaced = false;
  const out = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, () => {
    if (replaced) return '';
    replaced = true;
    return local;
  });
  // No stylesheet link at all (unexpected) — inject into <head>.
  return replaced ? out : out.replace('</head>', `${local}</head>`);
}

/** Inject the favicon link (after stripping, pages carry no icon link). */
function injectFavicon(html: string, depth: number): string {
  const prefix = '../'.repeat(depth);
  const tag = `<link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg"/>`;
  return html.includes('rel="icon"') ? html : html.replace('</head>', `${tag}</head>`);
}

function routeDepth(routePath: string): number {
  if (routePath === '/') return 0;
  return routePath.replace(/^\/+|\/+$/g, '').split('/').length;
}

function xmlSitemap(origin: string, paths: string[]): string {
  const urls = paths
    .map((p) => `  <url><loc>${origin}${p === '/' ? '' : p}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export interface StaticExportOptions {
  /** Origin to self-fetch pages from (the running app itself). */
  appOrigin: string;
  /** Cookie header to forward so owner-only (unpublished) sites render. */
  cookie?: string;
  /** Canonical origin stamped into robots/sitemap (custom domain when present). */
  siteOrigin?: string;
}

/** Render a website into a complete static ZIP archive. */
export async function exportStaticSite(
  websiteId: string,
  opts: StaticExportOptions,
): Promise<StaticExportResult | null> {
  const bundle = await loadSiteBundle(websiteId);
  if (!bundle) return null;

  const siteOrigin = opts.siteOrigin ?? `${opts.appOrigin}/sites/${websiteId}`;
  const routes = websiteRoutes(bundle.business);
  const theme = getTheme(bundle.themeId);
  const css = await loadStylesheet();
  const favicon = faviconSvg(bundle.business.name, theme.colors.brand);
  const basePrefix = `/sites/${websiteId}`;

  const entries: ZipEntry[] = [];
  let pages = 0;

  for (const route of routes) {
    const url = `${opts.appOrigin}${basePrefix}${route.path === '/' ? '' : route.path}?static=1`;
    const res = await fetch(url, {
      headers: opts.cookie ? { cookie: opts.cookie } : undefined,
      cache: 'no-store',
    });
    if (!res.ok) {
      logger.warn('static export: page fetch failed', { websiteId, path: route.path, status: res.status });
      continue;
    }
    let html = await res.text();
    const depth = routeDepth(route.path);
    html = stripNextRuntime(html);
    html = unwrapNextImages(html);
    html = relinkStylesheet(html, depth);
    html = injectFavicon(html, depth);
    // Site-root-relative links: the archive serves from its own root.
    html = html.replaceAll(`href="${basePrefix}"`, 'href="/"');
    html = html.replaceAll(`href="${basePrefix}/`, 'href="/');
    entries.push({ path: htmlPathFor(route.path), data: html });
    pages++;
  }

  if (pages === 0) return null;

  entries.push(
    { path: 'assets/site.css', data: css },
    { path: 'favicon.svg', data: favicon },
    { path: 'robots.txt', data: `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n` },
    { path: 'sitemap.xml', data: xmlSitemap(siteOrigin, routes.map((r) => r.path)) },
  );

  logger.info('static export built', { websiteId, pages });
  return {
    bytes: zipStore(entries, new Date()),
    fileName: `${bundle.slug || 'website'}-site.zip`,
    pages,
  };
}
