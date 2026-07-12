// Phase 8.5 — Job handlers. Registers concrete handlers for each queue type.
// Handlers do REAL internal work where no external credential is required, and
// return an honest "awaiting credentials" result where one is (never fabricated).
import { prisma } from '@/lib/db/prisma';
import { registerHandler } from '@/lib/jobs/queues';
import { notify } from '@/lib/jobs/notifications';
import { generateOneCore } from '@/lib/blog/service';
import { generateWebsiteCore } from '@/lib/websites/generate-service';
import { runDeployCore, runDeployForWebsiteCore } from '@/lib/deployment/service';

let installed = false;

/** Idempotently register all handlers. Imported by the worker entrypoint. */
export function installHandlers(): void {
  if (installed) return;
  installed = true;

  // notification.send — real: writes an in-app notification for the owner.
  registerHandler('notification.send', async (payload) => {
    const userId = String(payload.userId ?? '');
    if (!userId) throw new Error('notification.send requires userId');
    await notify({
      userId,
      level: (payload.level as 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO') ?? 'INFO',
      title: String(payload.title ?? 'Notification'),
      body: payload.body ? String(payload.body) : undefined,
    });
    return { delivered: true };
  });

  // analytics-sync.refresh — real internal recompute marker; external metrics
  // remain awaiting GA4/GSC credentials (Phase 10). No fabricated numbers.
  registerHandler('analytics.sync', async (payload) => {
    const workspaceId = payload.workspaceId ? String(payload.workspaceId) : undefined;
    const websites = workspaceId
      ? await prisma.website.count({ where: { project: { workspaceId } } })
      : await prisma.website.count();
    return { recomputed: true, websites, external: 'awaiting-credentials' };
  });

  // provider-sync.refresh — records that a provider status refresh ran; actual
  // connectivity depends on credentials configured in Phase 10.
  registerHandler('provider.sync', async (payload) => {
    return { provider: String(payload.provider ?? 'all'), status: 'awaiting-credentials' };
  });

  // maintenance.cleanup — real: prunes old succeeded jobs to bound table growth.
  registerHandler('maintenance.cleanup', async (payload) => {
    const days = Number(payload.days ?? 30);
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const res = await prisma.job.deleteMany({
      where: { status: 'SUCCEEDED', finishedAt: { lt: cutoff } },
    });
    return { pruned: res.count };
  });

  // blog.generate — REAL: bulk content generation (Phase 9 bulk ops). Reuses the
  // blog service's system-level core (deterministic baseline; live AI via Phase 10).
  registerHandler('blog.generate', async (payload) => {
    const websiteId = String(payload.websiteId ?? '');
    if (!websiteId) throw new Error('blog.generate requires websiteId');
    const created = await generateOneCore(websiteId, 'ARTICLE');
    return { websiteId, contentId: created.id, generated: true };
  });

  // website.generate — REAL: composes the website via the existing engines (adapter →
  // aiSelectBuild → composePage → saveBuilderDocument). Works offline (deterministic
  // selection + content synthesis); live AI selection/copy activates when a provider
  // key is configured. Single implementation shared with the dashboard action.
  registerHandler('website.generate', async (payload) => {
    const websiteId = String(payload.websiteId ?? '');
    if (!websiteId) throw new Error('website.generate requires websiteId');
    const result = await generateWebsiteCore(websiteId);
    return { ...result };
  });

  // deployment.run — REAL: builds & publishes via the deployment service's system core
  // (the single implementation shared with the session action). Two payload shapes:
  //   { deploymentId } — run a specific QUEUED deployment (single deploy / retry)
  //   { websiteId }    — bulk deploy: resolve the site's provider, create + run a row
  // Real cloud publish still needs provider credentials (Phase 10); providers report an
  // honest error/awaiting-credentials status until then — never fabricated success.
  registerHandler('deployment.run', async (payload) => {
    const deploymentId = payload.deploymentId ? String(payload.deploymentId) : '';
    const websiteId = payload.websiteId ? String(payload.websiteId) : '';
    if (deploymentId) {
      const result = await runDeployCore(deploymentId);
      return { deploymentId, status: result.status, url: result.url };
    }
    if (websiteId) {
      const result = await runDeployForWebsiteCore(websiteId);
      return { deploymentId: result.id, websiteId, status: result.status, url: result.url };
    }
    throw new Error('deployment.run requires deploymentId or websiteId');
  });

  // deployment.notify / blog.notify — lightweight event → notification bridges.
  registerHandler('deployment.notify', async (payload) => {
    const userId = payload.userId ? String(payload.userId) : '';
    if (userId) {
      await notify({
        userId,
        level: (payload.success ? 'SUCCESS' : 'ERROR') as 'SUCCESS' | 'ERROR',
        title: payload.success ? 'Deployment succeeded' : 'Deployment failed',
        body: payload.detail ? String(payload.detail) : undefined,
      });
    }
    return { notified: Boolean(userId) };
  });
}
