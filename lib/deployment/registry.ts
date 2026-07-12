import type { DeploymentProvider, ProviderId } from '@/lib/deployment/types';
import { ZipProvider } from '@/lib/deployment/providers/zip';
import {
  CloudflareProvider,
  VercelProvider,
  NetlifyProvider,
  DockerProvider,
  GithubProvider,
  CustomServerProvider,
} from '@/lib/deployment/providers/cloud';

/**
 * Provider registry — the single place hosts are registered. Add a provider here and
 * the dashboard/service pick it up automatically (Open/Closed). The engine resolves
 * providers only through this registry; nothing hard-codes a specific host.
 */
const PROVIDERS: Record<ProviderId, DeploymentProvider> = {
  zip: new ZipProvider(),
  cloudflare: new CloudflareProvider(),
  vercel: new VercelProvider(),
  netlify: new NetlifyProvider(),
  docker: new DockerProvider(),
  github: new GithubProvider(),
  custom: new CustomServerProvider(),
};

export function getProvider(id: string): DeploymentProvider | undefined {
  return PROVIDERS[id as ProviderId];
}

export function listProviders(): DeploymentProvider[] {
  return Object.values(PROVIDERS);
}

export function providerIds(): ProviderId[] {
  return Object.keys(PROVIDERS) as ProviderId[];
}
