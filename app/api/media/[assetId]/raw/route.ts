import { NextResponse } from 'next/server';
import { accessErrorResponse } from '@/lib/auth/access';
import { serverError } from '@/lib/api/security';
import { readAssetBytes } from '@/lib/media/service';

export const runtime = 'nodejs';

/**
 * Serve a media asset's bytes (Local storage). Tenant-access enforced in the service
 * (session cookie → workspace access), so private assets stay private. Cloud-stored
 * assets are served from their CDN URL, not proxied here.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  try {
    const asset = await readAssetBytes(assetId);
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(Buffer.from(asset.data), {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    return accessErrorResponse(err) ?? serverError('media/raw', err);
  }
}
