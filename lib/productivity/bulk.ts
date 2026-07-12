import { requireWorkspaceAccess, requireWebsiteAccess } from '@/lib/auth/access';
import { enqueue } from '@/lib/jobs/service';
import type { QueueName } from '@/lib/jobs/queues';

/**
 * Bulk operations (Phase 9). These REUSE the Background Jobs queue (Phase 8.5) — one
 * job per target — instead of doing work inline. Authorization happens here at the
 * enqueue site (the queue then runs jobs as the system). No duplication of the queue.
 */

interface BulkResult {
  enqueued: number;
  jobIds: string[];
}

async function enqueueEach(
  websiteIds: string[],
  queue: QueueName,
  type: string,
  workspaceId: string,
): Promise<BulkResult> {
  const jobIds: string[] = [];
  for (const websiteId of websiteIds) {
    // Verify access to each target before enqueuing work for it.
    await requireWebsiteAccess(websiteId, 'website:update');
    const job = await enqueue({ queue, type, workspaceId, payload: { websiteId } });
    jobIds.push(job.id);
  }
  return { enqueued: jobIds.length, jobIds };
}

/** Bulk website generation — enqueues an AI job per website. */
export async function bulkGenerateWebsites(workspaceId: string, websiteIds: string[]): Promise<BulkResult> {
  await requireWorkspaceAccess(workspaceId, 'website:update');
  return enqueueEach(websiteIds, 'ai', 'website.generate', workspaceId);
}

/** Bulk content/blog generation — enqueues a blog job per website. */
export async function bulkGenerateContent(workspaceId: string, websiteIds: string[]): Promise<BulkResult> {
  await requireWorkspaceAccess(workspaceId, 'website:update');
  return enqueueEach(websiteIds, 'blog', 'blog.generate', workspaceId);
}

/** Bulk deployment — enqueues a deployment job per website. */
export async function bulkDeploy(workspaceId: string, websiteIds: string[]): Promise<BulkResult> {
  await requireWorkspaceAccess(workspaceId, 'website:update');
  return enqueueEach(websiteIds, 'deployment', 'deployment.run', workspaceId);
}
