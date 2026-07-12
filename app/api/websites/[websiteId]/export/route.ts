import { NextResponse } from 'next/server';
import { requireWebsiteAccess, accessErrorResponse } from '@/lib/auth/access';
import { serverError } from '@/lib/api/security';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

/**
 * ZIP Export download — returns the website's publishable configuration bundle as a
 * downloadable JSON file. Tenant-access enforced. A full static-HTML archive depends
 * on the AI Generator's rendered output; until then this exports the config bundle.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  try {
    await requireWebsiteAccess(websiteId, 'website:view');
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
        'Content-Disposition': `attachment; filename="${w.slug || 'website'}-export.json"`,
      },
    });
  } catch (err) {
    return accessErrorResponse(err) ?? serverError('websites/export', err);
  }
}
