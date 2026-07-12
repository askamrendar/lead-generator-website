import {
  listDeployments,
  getDeploymentConfig,
  providerHealth,
} from '@/lib/deployment/service';
import { DeploymentDashboard } from '@/components/deployments/DeploymentDashboard';

/**
 * Website Deployments tab — the real Deployment Engine dashboard (Phase 8.0). Loads
 * deployment history, config, and provider health through the tenant-access-guarded
 * service (the website-detail layout already enforced access). ZIP export works with
 * no credentials; cloud providers show "not configured" until Phase 10 keys.
 */
export default async function WebsiteDeploymentsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const [deployments, config, health] = await Promise.all([
    listDeployments(websiteId),
    getDeploymentConfig(websiteId),
    providerHealth(websiteId),
  ]);

  return (
    <DeploymentDashboard
      websiteId={websiteId}
      deployments={deployments}
      config={config}
      health={health}
    />
  );
}
