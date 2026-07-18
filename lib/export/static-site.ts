import { loadSiteBundle, renderHtmlSite } from '@/lib/websites/render-service';
import { getHtmlPack } from '@/templates/html/registry';
import { zipStore, type ZipEntry } from '@/lib/export/zip';
import { resolveSiteUrl } from '@/lib/site';
import { logger } from '@/lib/logger';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Static-site ZIP export — generates every page of the website through its
 * chosen HTML template pack (lib/htmlgen — the same renderer the hosted
 * surface uses) and packages HTML + the pack's asset bundle (css/js/fonts/
 * images) + robots.txt + sitemap.xml into a dependency-free STORE ZIP.
 *
 * The archive is fully self-contained: open `index.html` locally or upload the
 * folder to any static host. The lead form posts back to this app's /api/lead.
 */

export interface StaticExportResult {
  bytes: Uint8Array;
  fileName: string;
  pages: number;
}

/** "/" → "index.html", "/about-us" → "about-us/index.html" (pretty URLs). */
function htmlPathFor(routePath: string): string {
  if (routePath === '/') return 'index.html';
  return `${routePath.replace(/^\/+/, '')}/index.html`;
}

/** Recursively collect the template asset files (small bundle, ~3 MB). */
async function collectAssets(dir: string, prefix: string): Promise<ZipEntry[]> {
  const out: ZipEntry[] = [];
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return out; // assets folder missing (shouldn't happen) — export HTML only
  }
  for (const name of names) {
    const full = path.join(dir, name);
    const rel = `${prefix}/${name}`;
    const stat = await fs.stat(full);
    if (stat.isDirectory()) {
      out.push(...(await collectAssets(full, rel)));
    } else {
      out.push({ path: rel, data: new Uint8Array(await fs.readFile(full)) });
    }
  }
  return out;
}

export interface StaticExportOptions {
  /** Canonical origin stamped into canonicals/robots/sitemap (custom domain when present). */
  siteOrigin?: string;
}

/** Render a website into a complete static ZIP archive. */
export async function exportStaticSite(
  websiteId: string,
  opts: StaticExportOptions = {},
): Promise<StaticExportResult | null> {
  const bundle = await loadSiteBundle(websiteId);
  if (!bundle) return null;

  const appOrigin = resolveSiteUrl();
  const siteOrigin = opts.siteOrigin ?? `${appOrigin}/sites/${websiteId}`;

  // Root-relative links + relative assets: the archive serves from its own root.
  const site = await renderHtmlSite(bundle, {
    origin: siteOrigin,
    base: '',
    assets: 'assets',
    appOrigin,
  });

  const entries: ZipEntry[] = site.pages.map((p) => {
    // Pages below the root reference assets relative to their own folder.
    const depth = p.path === '/' ? 0 : p.path.replace(/^\/+|\/+$/g, '').split('/').length;
    const html =
      depth === 0
        ? p.html
        : p.html
            .replaceAll('href="assets/', `href="${'../'.repeat(depth)}assets/`)
            .replaceAll('src="assets/', `src="${'../'.repeat(depth)}assets/`);
    return { path: htmlPathFor(p.path), data: html };
  });

  entries.push(
    { path: 'sitemap.xml', data: site.sitemapXml },
    { path: 'robots.txt', data: site.robotsTxt },
  );

  const assetsDir = path.join(
    process.cwd(),
    'public',
    'templates',
    getHtmlPack(bundle.htmlTemplateId).assetDir,
    'assets',
  );
  entries.push(...(await collectAssets(assetsDir, 'assets')));

  logger.info('static export built', { websiteId, pages: site.pages.length });
  return {
    bytes: zipStore(entries, new Date()),
    fileName: `${bundle.slug || 'website'}-site.zip`,
    pages: site.pages.length,
  };
}
