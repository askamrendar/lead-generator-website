'use server';

import { revalidatePath } from 'next/cache';
import {
  createDeployment,
  retryDeployment,
  cancelDeployment,
  rollbackDeployment,
  setDeploymentConfig,
  type DeploymentConfig,
} from '@/lib/deployment/service';
import { isAccessError } from '@/lib/auth/access';
import type { Environment, ProviderId } from '@/lib/deployment/types';

/**
 * Deployment server actions — thin wrappers over the deployment service (tenant-access
 * enforced). Access errors return a generic result; the UI toasts it.
 */
export type DeployResult = { ok: true } | { ok: false; error: string };

async function guard(fn: () => Promise<unknown>): Promise<DeployResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to deploy this website.' };
    throw err;
  }
}

export async function deployAction(
  websiteId: string,
  provider: ProviderId,
  environment: Environment,
): Promise<DeployResult> {
  const r = await guard(() => createDeployment(websiteId, provider, environment));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}/deployments`);
  return r;
}

export async function retryAction(websiteId: string, deploymentId: string): Promise<DeployResult> {
  const r = await guard(() => retryDeployment(deploymentId));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}/deployments`);
  return r;
}

export async function cancelAction(websiteId: string, deploymentId: string): Promise<DeployResult> {
  const r = await guard(() => cancelDeployment(deploymentId));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}/deployments`);
  return r;
}

export async function rollbackAction(websiteId: string, deploymentId: string): Promise<DeployResult> {
  const r = await guard(() => rollbackDeployment(deploymentId));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}/deployments`);
  return r;
}

export async function saveConfigAction(
  websiteId: string,
  config: DeploymentConfig,
): Promise<DeployResult> {
  const r = await guard(() => setDeploymentConfig(websiteId, config));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}/deployments`);
  return r;
}
