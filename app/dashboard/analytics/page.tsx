import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { workspaceAnalytics } from '@/lib/analytics/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={BarChart3} title="No workspace selected" description="Select a workspace to view analytics." />;
  }
  const summary = await workspaceAnalytics(ctx.currentWorkspace.id, Number(range) || 14);
  return (
    <PageContainer>
      <PageHeader title="Analytics" description="Workspace metrics, deployment activity, and website health." />
      <AnalyticsDashboard summary={summary} basePath="/dashboard/analytics" />
    </PageContainer>
  );
}
