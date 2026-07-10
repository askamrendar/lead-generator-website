import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { WebsiteWizard } from '@/components/websites/WebsiteWizard';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/dashboard/PageContainer';

export const metadata: Metadata = { title: 'New website' };

export default async function NewWebsitePage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return (
      <EmptyState
        icon={Globe}
        title="No workspace selected"
        description="Select a workspace before creating a website."
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create a website"
        description="Tell us about the business. We'll save the configuration — you can generate and edit next."
      />
      <WebsiteWizard workspaceId={ctx.currentWorkspace.id} />
    </PageContainer>
  );
}
