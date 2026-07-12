import type { Metadata } from 'next';
import { Image as ImageIcon } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listAssets, listFolders, storageHealth } from '@/lib/media/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { MediaLibrary } from '@/components/media/MediaLibrary';

export const metadata: Metadata = { title: 'Media Library' };

export default async function MediaPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={ImageIcon} title="No workspace selected" description="Select a workspace to manage media." />;
  }
  const wsId = ctx.currentWorkspace.id;
  const [assets, folders, health] = await Promise.all([
    listAssets(wsId),
    listFolders(wsId),
    storageHealth(wsId),
  ]);

  return (
    <PageContainer>
      <PageHeader title="Media Library" description="Reusable images, video, logos, and documents for this workspace." />
      <MediaLibrary workspaceId={wsId} assets={assets} folders={folders} health={health} />
    </PageContainer>
  );
}
