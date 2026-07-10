import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listWorkspaceWebsites } from '@/lib/websites/service';
import { WebsiteList } from '@/components/websites/WebsiteList';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Websites' };

export default async function WebsitesPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return (
      <EmptyState
        icon={Globe}
        title="No workspace selected"
        description="Create or select a workspace to manage websites."
      />
    );
  }

  const websites = await listWorkspaceWebsites(ctx.currentWorkspace.id, {
    includeArchived: true,
  });

  return <WebsiteList workspaceId={ctx.currentWorkspace.id} websites={websites} />;
}
