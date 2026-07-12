import { requireWebsiteAccess } from '@/lib/auth/access';
import { listAssets, listFolders, storageHealth } from '@/lib/media/service';
import { MediaLibrary } from '@/components/media/MediaLibrary';

/**
 * Website Media tab — the workspace's Media Library (Phase 8.2). Assets are workspace
 * -scoped and reusable across the workspace's websites; the website-detail layout
 * already enforced access, and the media service re-checks workspace access.
 */
export default async function WebsiteMediaPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const ctx = await requireWebsiteAccess(websiteId, 'website:view');
  const wsId = ctx.workspace!.id;
  const [assets, folders, health] = await Promise.all([
    listAssets(wsId),
    listFolders(wsId),
    storageHealth(wsId),
  ]);
  return <MediaLibrary workspaceId={wsId} assets={assets} folders={folders} health={health} />;
}
