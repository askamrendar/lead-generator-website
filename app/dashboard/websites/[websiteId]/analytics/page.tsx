import { websiteAnalytics } from '@/lib/analytics/service';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

/**
 * Website Analytics tab (Phase 8.4). Real internal metrics via the tenant-access
 * -guarded service; external sources (GA4/GSC) shown Awaiting-Credentials. Read-only.
 */
export default async function WebsiteAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { websiteId } = await params;
  const { range } = await searchParams;
  const summary = await websiteAnalytics(websiteId, Number(range) || 14);
  return (
    <AnalyticsDashboard summary={summary} basePath={`/dashboard/websites/${websiteId}/analytics`} />
  );
}
