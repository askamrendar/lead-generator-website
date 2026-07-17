import { NextResponse } from 'next/server';
import { requireWebsiteAccess, accessErrorResponse } from '@/lib/auth/access';
import { serverError } from '@/lib/api/security';
import { prisma } from '@/lib/db/prisma';
import { exportStaticSite } from '@/lib/export/static-site';
import { resolveSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Website export download. Default: a REAL static-site ZIP — every page rendered to
 * HTML (same pipeline as the hosted surface) + stylesheet + robots/sitemap/favicon,
 * ready to open locally or upload to any static host. `?format=config` returns the
 * legacy JSON configuration bundle. Tenant-access enforced.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  try {
    await requireWebsiteAccess(websiteId, 'website:view');

    const format = new URL(request.url).searchParams.get('format');
    if (format === 'config') {
      const w = await prisma.website.findUniqueOrThrow({
        where: { id: websiteId },
        select: {
          name: true,
          slug: true,
          language: true,
          timezone: true,
          themeId: true,
          templateId: true,
          industryId: true,
          businessConfig: true,
          builderConfig: true,
          seoConfig: true,
        },
      });
      const bundle = JSON.stringify({ exportedAt: new Date().toISOString(), website: w }, null, 2);
      return new NextResponse(bundle, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${w.slug || 'website'}-config.json"`,
        },
      });
    }

    // Prefer the site's primary verified custom domain as the canonical origin.
    const domain = await prisma.domain.findFirst({
      where: { websiteId, verified: true, status: 'ACTIVE' },
      orderBy: { isPrimary: 'desc' },
      select: { hostname: true },
    });

    const result = await exportStaticSite(websiteId, {
      siteOrigin: domain ? `https://${domain.hostname}` : `${resolveSiteUrl()}/sites/${websiteId}`,
    });
    if (!result) {
      return NextResponse.json(
        { error: 'Nothing to export — complete the website configuration first.' },
        { status: 422 },
      );
    }
    return new NextResponse(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'X-Export-Pages': String(result.pages),
      },
    });
  } catch (err) {
    return accessErrorResponse(err) ?? serverError('websites/export', err);
  }
}
