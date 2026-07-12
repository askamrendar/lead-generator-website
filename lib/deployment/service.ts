import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { getProvider, listProviders } from '@/lib/deployment/registry';
import { encryptSecretMap, decryptSecretMap } from '@/lib/security/secrets';
import { enqueue } from '@/lib/jobs/service';
import type {
  DeploymentInput,
  DeploymentResult,
  Environment,
  ProviderHealth,
  ProviderId,
} from '@/lib/deployment/types';

/**
 * Deployment service — the ONLY read/write path for deployments. Every session-facing op
 * routes through the tenant-access layer (`requireWebsiteAccess`) with the right permission.
 *
 * Deploys are ASYNCHRONOUS: `createDeployment`/`retryDeployment` create a QUEUED `Deployment`
 * row and enqueue a `deployment.run` job (Phase 8.5 queue), returning immediately. The
 * background worker runs `runDeployCore` (the single build/publish implementation, shared
 * with bulk deploy), which updates that same row to its terminal status. No provider build
 * runs inside a request. The Builder never calls this.
 */

export interface DeploymentConfig {
  provider?: ProviderId;
  envVars?: Record<string, string>;
}

export interface DeploymentDTO {
  id: string;
  provider: string;
  status: string;
  environment: string;
  url: string | null;
  error: string | null;
  logs: string[];
  durationMs: number | null;
  createdAt: string;
  finishedAt: string | null;
}

type DeploymentRow = {
  id: string;
  provider: string;
  status: string;
  environment: string;
  url: string | null;
  error: string | null;
  logs: unknown;
  durationMs: number | null;
  createdAt: Date;
  finishedAt: Date | null;
};

function toDTO(r: DeploymentRow): DeploymentDTO {
  return {
    id: r.id,
    provider: r.provider,
    status: r.status,
    environment: r.environment,
    url: r.url,
    error: r.error,
    logs: Array.isArray(r.logs) ? (r.logs as string[]) : [],
    durationMs: r.durationMs,
    createdAt: r.createdAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
  };
}

/** Merge website-stored env vars with any org-level env credentials for the keys a provider needs. */
function resolveCredentials(keys: string[], envVars: Record<string, string>): Record<string, string> {
  const creds: Record<string, string> = { ...envVars };
  for (const k of keys) if (!creds[k] && process.env[k]) creds[k] = process.env[k]!;
  return creds;
}

export async function getDeploymentConfig(websiteId: string): Promise<DeploymentConfig> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { deploymentConfig: true },
  });
  const config = (w.deploymentConfig as DeploymentConfig | null) ?? {};
  // Decrypt provider secrets for display/editing round-trip.
  return { ...config, envVars: decryptSecretMap(config.envVars) };
}

export async function setDeploymentConfig(websiteId: string, config: DeploymentConfig): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  // Encrypt provider secrets at rest (no-op passthrough when no key is configured).
  const toStore: DeploymentConfig = { ...config, envVars: encryptSecretMap(config.envVars) };
  await prisma.website.update({
    where: { id: websiteId },
    data: { deploymentConfig: toStore as unknown as object },
  });
}

export async function listDeployments(websiteId: string): Promise<DeploymentDTO[]> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const rows = await prisma.deployment.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return rows.map(toDTO);
}

/**
 * Build the provider input for a website (artifact + decrypted credentials). Shared by
 * the deploy runner and rollback so credential handling lives in exactly one place.
 */
async function buildDeploymentInput(
  websiteId: string,
  providerId: ProviderId,
  environment: Environment,
  credentialKeys: string[],
): Promise<DeploymentInput> {
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { slug: true, builderConfig: true, deploymentConfig: true },
  });
  const config = (w.deploymentConfig as DeploymentConfig | null) ?? {};
  const envVars = decryptSecretMap(config.envVars) ?? {};
  return {
    websiteId,
    websiteSlug: w.slug,
    provider: providerId,
    environment,
    envVars,
    artifact: w.builderConfig,
    credentials: resolveCredentials(credentialKeys, envVars),
  };
}

/**
 * SYSTEM-level deploy runner (no session auth — authorized at the enqueue site). Runs a
 * single QUEUED deployment row through its provider and updates that SAME row to terminal
 * status. Idempotent: a row that is not QUEUED (already run, or cancelled) is returned
 * unchanged, so a duplicate job delivery can't double-deploy. Called by the
 * `deployment.run` job handler.
 */
export async function runDeployCore(deploymentId: string): Promise<DeploymentDTO> {
  const dep = await prisma.deployment.findUniqueOrThrow({
    where: { id: deploymentId },
    select: { id: true, websiteId: true, provider: true, environment: true, status: true },
  });

  // Only a freshly-queued deployment may run (guards against re-delivery / cancellation).
  if (dep.status !== 'QUEUED') {
    const current = await prisma.deployment.findUniqueOrThrow({ where: { id: deploymentId } });
    return toDTO(current as DeploymentRow);
  }

  const provider = getProvider(dep.provider as ProviderId);
  if (!provider) {
    const row = await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'ERROR', error: `Unknown provider: ${dep.provider}`, finishedAt: new Date() },
    });
    return toDTO(row as DeploymentRow);
  }

  await prisma.deployment.update({ where: { id: deploymentId }, data: { status: 'DEPLOYING' } });

  const input = await buildDeploymentInput(
    dep.websiteId,
    dep.provider as ProviderId,
    dep.environment as Environment,
    provider.credentialKeys,
  );

  const started = Date.now();
  const validation = await provider.validate(input);
  const result: DeploymentResult = validation.ok
    ? await provider.deploy(input)
    : { ok: false, status: 'ERROR', error: validation.errors.join(' '), logs: validation.errors };

  const row = await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status: result.status,
      url: result.url ?? null,
      error: result.error ?? null,
      logs: result.logs as unknown as object,
      durationMs: Date.now() - started,
      finishedAt: new Date(),
    },
  });
  return toDTO(row as DeploymentRow);
}

/**
 * SYSTEM-level entry for BULK deploy (one job per website, no pre-created row). Resolves
 * the website's configured provider (default `zip`), creates a QUEUED row, and runs it.
 * Used by the `deployment.run` handler when the payload carries a `websiteId`.
 */
export async function runDeployForWebsiteCore(websiteId: string): Promise<DeploymentDTO> {
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { deploymentConfig: true },
  });
  const config = (w.deploymentConfig as DeploymentConfig | null) ?? {};
  const providerId = config.provider ?? 'zip';
  const row = await prisma.deployment.create({
    data: { websiteId, provider: providerId, environment: 'production', status: 'QUEUED' },
  });
  return runDeployCore(row.id);
}

export async function createDeployment(
  websiteId: string,
  providerId: ProviderId,
  environment: Environment = 'production',
): Promise<DeploymentDTO> {
  const ctx = await requireWebsiteAccess(websiteId, 'website:publish');
  if (!getProvider(providerId)) throw new Error(`Unknown provider: ${providerId}`);

  // Create the QUEUED row, then hand the actual build/publish to the background queue.
  const row = await prisma.deployment.create({
    data: { websiteId, provider: providerId, environment, status: 'QUEUED' },
  });
  await enqueue({
    queue: 'deployment',
    type: 'deployment.run',
    workspaceId: ctx.workspace?.id,
    payload: { deploymentId: row.id, websiteId },
  });
  return toDTO(row as DeploymentRow);
}

export async function retryDeployment(deploymentId: string): Promise<DeploymentDTO> {
  const src = await prisma.deployment.findUniqueOrThrow({
    where: { id: deploymentId },
    select: { websiteId: true, provider: true, environment: true },
  });
  const ctx = await requireWebsiteAccess(src.websiteId, 'website:publish');
  // A retry is a fresh QUEUED deployment (preserves history) run via the queue.
  const row = await prisma.deployment.create({
    data: {
      websiteId: src.websiteId,
      provider: src.provider,
      environment: src.environment,
      status: 'QUEUED',
    },
  });
  await enqueue({
    queue: 'deployment',
    type: 'deployment.run',
    workspaceId: ctx.workspace?.id,
    payload: { deploymentId: row.id, websiteId: src.websiteId },
  });
  return toDTO(row as DeploymentRow);
}

export async function cancelDeployment(deploymentId: string): Promise<void> {
  const src = await prisma.deployment.findUniqueOrThrow({
    where: { id: deploymentId },
    select: { websiteId: true, status: true },
  });
  await requireWebsiteAccess(src.websiteId, 'website:publish');
  // Only in-flight deploys can be cancelled.
  if (['QUEUED', 'BUILDING', 'DEPLOYING'].includes(src.status)) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    });
  }
}

export async function rollbackDeployment(deploymentId: string): Promise<DeploymentDTO> {
  const src = await prisma.deployment.findUniqueOrThrow({
    where: { id: deploymentId },
    select: { websiteId: true, provider: true, environment: true },
  });
  await requireWebsiteAccess(src.websiteId, 'website:publish');
  const provider = getProvider(src.provider);
  // Rollback is a fast compensating action (not a build), so it runs inline and records
  // a new terminal row — it never blocks on a provider build the way a deploy does.
  const input = await buildDeploymentInput(
    src.websiteId,
    src.provider as ProviderId,
    src.environment as Environment,
    provider?.credentialKeys ?? [],
  );
  const result = provider
    ? await provider.rollback(deploymentId, input)
    : ({ ok: false, status: 'ERROR', error: 'Unknown provider', logs: [] } as DeploymentResult);
  const row = await prisma.deployment.create({
    data: {
      websiteId: src.websiteId,
      provider: src.provider,
      environment: src.environment,
      status: result.ok ? 'ROLLED_BACK' : 'ERROR',
      error: result.error ?? null,
      logs: result.logs as unknown as object,
      finishedAt: new Date(),
    },
  });
  return toDTO(row as DeploymentRow);
}

export async function providerHealth(websiteId: string): Promise<ProviderHealth[]> {
  // getDeploymentConfig already enforces access AND decrypts envVars.
  const config = await getDeploymentConfig(websiteId);
  const envVars = config.envVars ?? {};
  return Promise.all(
    listProviders().map((p) => p.health(resolveCredentials(p.credentialKeys, envVars))),
  );
}
