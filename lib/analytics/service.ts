import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess, requireWebsiteAccess } from '@/lib/auth/access';
import { externalSources } from '@/lib/analytics/providers';
import { formatBytes } from '@/lib/media/kind';
import type { AnalyticsSummary, MetricTile, TrendPoint, HealthReport } from '@/lib/analytics/types';

/**
 * Analytics service — reports real metrics computed from existing tables (websites,
 * deployments, content, media, domains). Read-only + tenant-access guarded; never
 * edits anything. Traffic/rankings/CWV come from external providers (GA4/GSC) which
 * are credential-gated (Awaiting Credentials until Phase 10) — never fabricated.
 */
function clampRange(days: number): number {
  return Math.max(7, Math.min(90, Math.round(days) || 14));
}

function bucketByDay(dates: Date[], days: number): TrendPoint[] {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: TrendPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ date: key, value: counts.get(key) ?? 0 });
  }
  return out;
}

interface Raw {
  websiteStatuses: string[];
  deployDates: Date[];
  deployReady: number;
  contentTotal: number;
  contentPublished: number;
  mediaCount: number;
  mediaBytes: number;
  domainStatuses: string[];
}

function buildSummary(scope: 'workspace' | 'website', raw: Raw, rangeDays: number, cloudCreds: Record<string, string | undefined>): AnalyticsSummary {
  const published = raw.websiteStatuses.filter((s) => s === 'PUBLISHED').length;
  const activeDomains = raw.domainStatuses.filter((s) => s === 'ACTIVE').length;

  const tiles: MetricTile[] = [
    { key: 'websites', label: scope === 'website' ? 'Website' : 'Websites', value: raw.websiteStatuses.length },
    { key: 'published', label: 'Published', value: published },
    { key: 'deployments', label: `Deployments (${rangeDays}d)`, value: raw.deployDates.length, hint: `${raw.deployReady} succeeded` },
    { key: 'content', label: 'Content items', value: raw.contentTotal, hint: `${raw.contentPublished} published` },
    { key: 'media', label: 'Media assets', value: raw.mediaCount, hint: formatBytes(raw.mediaBytes) },
    { key: 'domains', label: 'Domains', value: raw.domainStatuses.length, hint: `${activeDomains} active` },
  ];

  const factors = [
    { label: 'Has a published website', ok: published > 0 },
    { label: 'Has content', ok: raw.contentTotal > 0 },
    { label: 'Has a connected domain', ok: raw.domainStatuses.length > 0 },
    { label: 'Has deployed', ok: raw.deployDates.length > 0 || raw.deployReady > 0 },
  ];
  const okCount = factors.filter((f) => f.ok).length;
  const score = Math.round((okCount / factors.length) * 100);
  const health: HealthReport = {
    score,
    label: score >= 75 ? 'Healthy' : score >= 50 ? 'Fair' : 'Needs attention',
    factors,
  };

  return {
    scope,
    rangeDays,
    tiles,
    deploymentTrend: bucketByDay(raw.deployDates, rangeDays),
    external: externalSources(cloudCreds),
    health,
  };
}

const creds = (): Record<string, string | undefined> => ({ ...process.env });

export async function workspaceAnalytics(workspaceId: string, rangeDays = 14): Promise<AnalyticsSummary> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  const days = clampRange(rangeDays);
  const since = new Date(Date.now() - days * 86_400_000);
  const wsFilter = { project: { workspaceId } };

  const [websites, deployRows, contentTotal, contentPublished, media, domains] = await Promise.all([
    prisma.website.findMany({ where: wsFilter, select: { status: true } }),
    prisma.deployment.findMany({ where: { website: wsFilter, createdAt: { gte: since } }, select: { status: true, createdAt: true } }),
    prisma.contentItem.count({ where: { website: wsFilter } }),
    prisma.contentItem.count({ where: { website: wsFilter, status: 'PUBLISHED' } }),
    prisma.mediaAsset.aggregate({ where: { workspaceId }, _count: true, _sum: { sizeBytes: true } }),
    prisma.domain.findMany({ where: { website: wsFilter }, select: { status: true } }),
  ]);

  return buildSummary('workspace', {
    websiteStatuses: websites.map((w) => w.status),
    deployDates: deployRows.map((d) => d.createdAt),
    deployReady: deployRows.filter((d) => d.status === 'READY').length,
    contentTotal, contentPublished,
    mediaCount: media._count, mediaBytes: media._sum.sizeBytes ?? 0,
    domainStatuses: domains.map((d) => d.status),
  }, days, creds());
}

export async function websiteAnalytics(websiteId: string, rangeDays = 14): Promise<AnalyticsSummary> {
  const ctx = await requireWebsiteAccess(websiteId, 'website:view');
  const workspaceId = ctx.workspace!.id;
  const days = clampRange(rangeDays);
  const since = new Date(Date.now() - days * 86_400_000);

  const [website, deployRows, contentTotal, contentPublished, media, domains] = await Promise.all([
    prisma.website.findUniqueOrThrow({ where: { id: websiteId }, select: { status: true } }),
    prisma.deployment.findMany({ where: { websiteId, createdAt: { gte: since } }, select: { status: true, createdAt: true } }),
    prisma.contentItem.count({ where: { websiteId } }),
    prisma.contentItem.count({ where: { websiteId, status: 'PUBLISHED' } }),
    prisma.mediaAsset.aggregate({ where: { workspaceId }, _count: true, _sum: { sizeBytes: true } }),
    prisma.domain.findMany({ where: { websiteId }, select: { status: true } }),
  ]);

  return buildSummary('website', {
    websiteStatuses: [website.status],
    deployDates: deployRows.map((d) => d.createdAt),
    deployReady: deployRows.filter((d) => d.status === 'READY').length,
    contentTotal, contentPublished,
    mediaCount: media._count, mediaBytes: media._sum.sizeBytes ?? 0,
    domainStatuses: domains.map((d) => d.status),
  }, days, creds());
}
