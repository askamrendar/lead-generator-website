import { listDomains, domainProviderHealth } from '@/lib/domains/service';
import { DomainManager } from '@/components/domains/DomainManager';

/**
 * Website Domains tab — the real Domain Manager (Phase 8.1). Loads domains + provider
 * health through the tenant-access-guarded service (access already enforced by the
 * website-detail layout). Independent module — never touches deployment or content.
 */
export default async function WebsiteDomainsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const [domains, health] = await Promise.all([
    listDomains(websiteId),
    domainProviderHealth(websiteId),
  ]);
  return <DomainManager websiteId={websiteId} domains={domains} health={health} />;
}
