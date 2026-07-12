import { listRevisions } from '@/lib/productivity/service';
import { VersionHistory } from '@/components/productivity/VersionHistory';

/**
 * Website Versions tab (Phase 9). Manual snapshots + restore of the builder/business
 * config, via the tenant-access-guarded productivity service. No duplicate storage —
 * revisions live on `Website.revisions`.
 */
export default async function WebsiteVersionsPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const revisions = await listRevisions(websiteId);
  return <VersionHistory websiteId={websiteId} revisions={revisions} />;
}
