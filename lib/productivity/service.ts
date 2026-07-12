import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess, requireWebsiteAccess } from '@/lib/auth/access';
import { pushRevision, readRevisions, findRevision, type Revision } from '@/lib/productivity/revisions';
import type { WebsiteSummary } from '@/lib/websites/types';

/**
 * Single-User Productivity service (Phase 9). Reuses the tenant-access layer and the
 * Website aggregate — it never duplicates website CRUD (that lives in lib/websites),
 * only adds productivity reads/writes: recent, pinned, favorites, trash, version
 * history, export/import/backup. Every call is tenant-access guarded.
 */

const CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  industryId: true,
  themeId: true,
  templateId: true,
  language: true,
  timezone: true,
  generatedAt: true,
  archivedAt: true,
  trashedAt: true,
  pinnedAt: true,
  favorite: true,
  lastOpenedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Row = {
  id: string; name: string; slug: string; status: WebsiteSummary['status'];
  industryId: string | null; themeId: string | null; templateId: string | null;
  language: string; timezone: string; generatedAt: Date | null; archivedAt: Date | null;
  trashedAt: Date | null; pinnedAt: Date | null; favorite: boolean; lastOpenedAt: Date | null;
  createdAt: Date; updatedAt: Date;
};

function toSummary(w: Row): WebsiteSummary {
  return {
    id: w.id, name: w.name, slug: w.slug, status: w.status,
    industryId: w.industryId, themeId: w.themeId, templateId: w.templateId,
    language: w.language, timezone: w.timezone,
    generatedAt: w.generatedAt?.toISOString() ?? null,
    archivedAt: w.archivedAt?.toISOString() ?? null,
    trashedAt: w.trashedAt?.toISOString() ?? null,
    pinnedAt: w.pinnedAt?.toISOString() ?? null,
    favorite: w.favorite,
    lastOpenedAt: w.lastOpenedAt?.toISOString() ?? null,
    createdAt: w.createdAt.toISOString(), updatedAt: w.updatedAt.toISOString(),
  };
}

const LIVE: WebsiteSummary['status'][] = ['DRAFT', 'GENERATED', 'PUBLISHED'];

/** Recently opened/updated websites (excludes archived + trashed). */
export async function recentWebsites(workspaceId: string, limit = 8): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  const rows = await prisma.website.findMany({
    where: { project: { workspaceId }, status: { in: LIVE } },
    orderBy: [{ lastOpenedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
    take: limit,
    select: CARD_SELECT,
  });
  return rows.map(toSummary);
}

/** Pinned websites (most-recently pinned first). */
export async function pinnedWebsites(workspaceId: string): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  const rows = await prisma.website.findMany({
    where: { project: { workspaceId }, status: { in: LIVE }, pinnedAt: { not: null } },
    orderBy: { pinnedAt: 'desc' },
    select: CARD_SELECT,
  });
  return rows.map(toSummary);
}

/** Favorited websites. */
export async function favoriteWebsites(workspaceId: string): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  const rows = await prisma.website.findMany({
    where: { project: { workspaceId }, status: { in: LIVE }, favorite: true },
    orderBy: { updatedAt: 'desc' },
    select: CARD_SELECT,
  });
  return rows.map(toSummary);
}

/** Websites currently in Trash. */
export async function trashedWebsites(workspaceId: string): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  const rows = await prisma.website.findMany({
    where: { project: { workspaceId }, status: 'TRASHED' },
    orderBy: { trashedAt: 'desc' },
    select: CARD_SELECT,
  });
  return rows.map(toSummary);
}

/** Archived websites. */
export async function archivedWebsites(workspaceId: string): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  const rows = await prisma.website.findMany({
    where: { project: { workspaceId }, status: 'ARCHIVED' },
    orderBy: { archivedAt: 'desc' },
    select: CARD_SELECT,
  });
  return rows.map(toSummary);
}

export async function setPinned(websiteId: string, pinned: boolean): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({
    where: { id: websiteId },
    data: { pinnedAt: pinned ? new Date() : null },
  });
}

export async function setFavorite(websiteId: string, favorite: boolean): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({ where: { id: websiteId }, data: { favorite } });
}

/** Record that a website was opened (drives Recent). */
export async function touchWebsite(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:view');
  await prisma.website.update({ where: { id: websiteId }, data: { lastOpenedAt: new Date() } });
}

// ----- Version history -----------------------------------------------------

export interface RevisionSummary {
  id: string;
  at: string;
  label: string;
}

export async function listRevisions(websiteId: string): Promise<RevisionSummary[]> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { revisions: true },
  });
  return readRevisions(w.revisions).map((r) => ({ id: r.id, at: r.at, label: r.label }));
}

/** Capture a manual snapshot of the current builder + business config. */
export async function saveRevision(websiteId: string, label: string, id: string, at: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { revisions: true, builderConfig: true, businessConfig: true },
  });
  const next: Revision = { id, at, label, builderConfig: w.builderConfig, businessConfig: w.businessConfig };
  const revisions = pushRevision(w.revisions, next);
  await prisma.website.update({
    where: { id: websiteId },
    data: { revisions: revisions as unknown as object },
  });
}

/** Restore a website's builder/business config from a stored revision. */
export async function restoreRevision(websiteId: string, revisionId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { revisions: true },
  });
  const rev = findRevision(w.revisions, revisionId);
  if (!rev) throw new Error('Revision not found');
  await prisma.website.update({
    where: { id: websiteId },
    data: {
      builderConfig: (rev.builderConfig ?? undefined) as object | undefined,
      businessConfig: (rev.businessConfig ?? undefined) as object | undefined,
    },
  });
}

// ----- Export / Import / Backup --------------------------------------------

export interface WebsiteExport {
  format: 'leadgen-website';
  version: 1;
  name: string;
  slug: string;
  language: string;
  timezone: string;
  themeId: string | null;
  templateId: string | null;
  industryId: string | null;
  businessConfig: unknown;
  builderConfig: unknown;
  seoConfig: unknown;
  exportedAt: string;
}

/** Serialize a website's portable config (no tenant ids) for export/backup. */
export async function exportWebsite(websiteId: string, exportedAt: string): Promise<WebsiteExport> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: {
      name: true, slug: true, language: true, timezone: true,
      themeId: true, templateId: true, industryId: true,
      businessConfig: true, builderConfig: true, seoConfig: true,
    },
  });
  return {
    format: 'leadgen-website',
    version: 1,
    name: w.name, slug: w.slug, language: w.language, timezone: w.timezone,
    themeId: w.themeId, templateId: w.templateId, industryId: w.industryId,
    businessConfig: w.businessConfig, builderConfig: w.builderConfig, seoConfig: w.seoConfig,
    exportedAt,
  };
}

/** Create a new website in a workspace from an export bundle (Import / Restore). */
export async function importWebsite(workspaceId: string, data: WebsiteExport): Promise<{ id: string }> {
  const ctx = await requireWorkspaceAccess(workspaceId, 'website:create');
  const project = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const projectId =
    project?.id ??
    (await prisma.project.create({
      data: { name: 'Default Project', slug: 'default', workspaceId, ownerId: ctx.userId },
      select: { id: true },
    })).id;

  // Unique slug within the project.
  const base = (data.slug || 'imported-website').toLowerCase();
  const existing = await prisma.website.findMany({
    where: { projectId, slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set(existing.map((e) => e.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

  const created = await prisma.website.create({
    data: {
      name: data.name || 'Imported Website',
      slug,
      projectId,
      language: data.language || 'en-US',
      timezone: data.timezone || 'UTC',
      themeId: data.themeId ?? undefined,
      templateId: data.templateId ?? undefined,
      industryId: data.industryId ?? undefined,
      businessConfig: (data.businessConfig ?? undefined) as object | undefined,
      builderConfig: (data.builderConfig ?? undefined) as object | undefined,
      seoConfig: (data.seoConfig ?? undefined) as object | undefined,
      status: 'DRAFT',
    },
    select: { id: true },
  });
  return { id: created.id };
}
