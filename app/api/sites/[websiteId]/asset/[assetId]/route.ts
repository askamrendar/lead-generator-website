import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { readAssetBytesCore } from '@/lib/media/service';
import { requireWebsiteAccess, isAccessError } from '@/lib/auth/access';

export const runtime = 'nodejs';

/**
 * Public tenant-site asset route — serves media (e.g. the AI-generated hero
 * image) on published websites without a session, so hosted sites, previews,
 * and static exports can reference images.
 *
 * Gate (fail-closed 404, tenant-hidden):
 *   1. website exists AND the asset belongs to the website's own workspace
 *   2. website is PUBLISHED → public;  otherwise → owner session required
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ websiteId: string; assetId: string }> },
) {
  const { websiteId, assetId } = await params;

  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { status: true, project: { select: { workspaceId: true } } },
  });
  if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (website.status !== 'PUBLISHED') {
    try {
      await requireWebsiteAccess(websiteId, 'website:view');
    } catch (err) {
      if (isAccessError(err)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      throw err;
    }
  }

  const asset = await readAssetBytesCore(assetId);
  if (!asset || asset.workspaceId !== website.project.workspaceId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(Buffer.from(asset.data), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
