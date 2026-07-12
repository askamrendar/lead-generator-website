import type { Metadata } from 'next';
import { Trash2 } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { trashedWebsites, archivedWebsites } from '@/lib/productivity/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { TrashList } from '@/components/productivity/TrashList';

export const metadata: Metadata = { title: 'Trash & Archive' };

export default async function TrashPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={Trash2} title="No workspace selected" description="Select a workspace to view trash." />;
  }
  const wsId = ctx.currentWorkspace.id;
  const [trashed, archived] = await Promise.all([trashedWebsites(wsId), archivedWebsites(wsId)]);

  return (
    <PageContainer>
      <PageHeader title="Trash & Archive" description="Restore deleted or archived websites, or delete them permanently." />
      <TrashList trashed={trashed} archived={archived} />
    </PageContainer>
  );
}
