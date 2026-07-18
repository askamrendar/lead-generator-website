import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess, requireWebsiteAccess } from '@/lib/auth/access';
import { slugify } from '@/lib/utils';
import { isHtmlPackId } from '@/templates/html/registry';
import type { WebsiteSummary, WebsiteDetail, WebsiteBusinessConfig } from '@/lib/websites/types';
import type { WebsiteWizardInput } from '@/lib/websites/schema';

/**
 * Website data service — the ONLY place websites are read/written. Every function
 * goes through the tenant-access layer (`require*Access`) with the right permission,
 * so authorization + tenant scoping are centralized and cross-tenant access is
 * impossible. Returns plain DTOs (never raw Prisma rows) to callers.
 *
 * The Website is the central aggregate; the Builder/AI/Deployment engines are NOT
 * touched here — they attach to Website in later milestones.
 */

const SUMMARY_SELECT = {
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

type SummaryRow = {
  id: string;
  name: string;
  slug: string;
  status: WebsiteSummary['status'];
  industryId: string | null;
  themeId: string | null;
  templateId: string | null;
  language: string;
  timezone: string;
  generatedAt: Date | null;
  archivedAt: Date | null;
  trashedAt: Date | null;
  pinnedAt: Date | null;
  favorite: boolean;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toSummary(w: SummaryRow): WebsiteSummary {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    status: w.status,
    industryId: w.industryId,
    themeId: w.themeId,
    templateId: w.templateId,
    language: w.language,
    timezone: w.timezone,
    generatedAt: w.generatedAt?.toISOString() ?? null,
    archivedAt: w.archivedAt?.toISOString() ?? null,
    trashedAt: w.trashedAt?.toISOString() ?? null,
    pinnedAt: w.pinnedAt?.toISOString() ?? null,
    favorite: w.favorite,
    lastOpenedAt: w.lastOpenedAt?.toISOString() ?? null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

/** Lazily ensure the workspace has a project to hold websites (hierarchy: Org→Workspace→Project→Website). */
async function ensureDefaultProject(workspaceId: string, ownerId: string): Promise<string> {
  const existing = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (existing) return existing.id;
  const project = await prisma.project.create({
    data: { name: 'Default Project', slug: 'default', workspaceId, ownerId },
    select: { id: true },
  });
  return project.id;
}

/** A slug unique within the project (base, base-2, base-3, …). */
async function uniqueWebsiteSlug(projectId: string, base: string): Promise<string> {
  const root = slugify(base) || 'website';
  const existing = await prisma.website.findMany({
    where: { projectId, slug: { startsWith: root } },
    select: { slug: true },
  });
  const taken = new Set(existing.map((e) => e.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function listWorkspaceWebsites(
  workspaceId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<WebsiteSummary[]> {
  await requireWorkspaceAccess(workspaceId, 'website:view');
  // Trashed sites are always excluded from the main list (they live in Trash);
  // archived sites are excluded unless explicitly requested.
  const excluded: WebsiteSummary['status'][] = opts.includeArchived
    ? ['TRASHED']
    : ['TRASHED', 'ARCHIVED'];
  const rows = await prisma.website.findMany({
    where: {
      project: { workspaceId },
      status: { notIn: excluded },
    },
    // Pinned first (most-recently pinned), then most-recently updated.
    orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

export async function getWebsite(websiteId: string): Promise<WebsiteDetail> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { ...SUMMARY_SELECT, businessConfig: true },
  });
  return {
    ...toSummary(w),
    businessConfig: (w.businessConfig as WebsiteBusinessConfig | null) ?? null,
  };
}

export async function createWebsite(
  workspaceId: string,
  input: WebsiteWizardInput,
): Promise<{ id: string }> {
  const ctx = await requireWorkspaceAccess(workspaceId, 'website:create');
  const projectId = await ensureDefaultProject(workspaceId, ctx.userId);
  const slug = await uniqueWebsiteSlug(projectId, input.business.businessName);

  const website = await prisma.website.create({
    data: {
      name: input.business.businessName,
      slug,
      projectId,
      businessConfig: input as unknown as object,
      status: 'DRAFT',
    },
    select: { id: true },
  });
  return { id: website.id };
}

export async function renameWebsite(websiteId: string, name: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({ where: { id: websiteId }, data: { name } });
}

/** Switch the HTML template pack the site renders through. Takes effect on the
 *  next render (pages are derived) — no regeneration needed. */
export async function setWebsiteTemplate(websiteId: string, templateId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  if (!isHtmlPackId(templateId)) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  await prisma.website.update({ where: { id: websiteId }, data: { templateId } });
}

/** Duplicate (a.k.a. clone) a website into the same workspace as a fresh DRAFT. */
export async function duplicateWebsite(websiteId: string): Promise<{ id: string }> {
  const ctx = await requireWebsiteAccess(websiteId, 'website:view');
  await requireWorkspaceAccess(ctx.workspace!.id, 'website:create');

  const source = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: {
      name: true,
      projectId: true,
      language: true,
      timezone: true,
      themeId: true,
      templateId: true,
      industryId: true,
      businessConfig: true,
      seoConfig: true,
    },
  });

  const name = `${source.name} (Copy)`;
  const slug = await uniqueWebsiteSlug(source.projectId, name);
  const copy = await prisma.website.create({
    data: {
      name,
      slug,
      projectId: source.projectId,
      language: source.language,
      timezone: source.timezone,
      themeId: source.themeId,
      templateId: source.templateId,
      industryId: source.industryId,
      businessConfig: (source.businessConfig ?? undefined) as object | undefined,
      seoConfig: (source.seoConfig ?? undefined) as object | undefined,
      status: 'DRAFT', // a copy always starts ungenerated
    },
    select: { id: true },
  });
  return { id: copy.id };
}

export async function archiveWebsite(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({
    where: { id: websiteId },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });
}

export async function restoreWebsite(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({
    where: { id: websiteId },
    data: { status: 'DRAFT', archivedAt: null },
  });
}

/**
 * Soft-delete to Trash (Phase 9). Recoverable via `restoreFromTrash`. This is the
 * default "delete" action from the UI — a hard delete only happens on explicit purge.
 */
export async function deleteWebsite(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:delete');
  await prisma.website.update({
    where: { id: websiteId },
    data: { status: 'TRASHED', trashedAt: new Date() },
  });
}

/** Restore a website out of Trash back to DRAFT. */
export async function restoreFromTrash(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await prisma.website.update({
    where: { id: websiteId },
    data: { status: 'DRAFT', trashedAt: null },
  });
}

/** Permanently delete a website (purge from Trash). Irreversible. */
export async function purgeWebsite(websiteId: string): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:delete');
  await prisma.website.delete({ where: { id: websiteId } });
}
