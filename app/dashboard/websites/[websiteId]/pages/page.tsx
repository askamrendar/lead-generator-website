import { listContent } from '@/lib/blog/service';
import { ContentManager } from '@/components/blog/ContentManager';

/**
 * Website Pages/Content tab — the AI Blog Generator's content manager (Phase 8.3).
 * Loads content items through the tenant-access-guarded service (access already
 * enforced by the website-detail layout). Independent module; never renders pages
 * itself (the SEO/builder engines do).
 */
export default async function WebsitePagesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const items = await listContent(websiteId);
  return <ContentManager websiteId={websiteId} items={items} />;
}
