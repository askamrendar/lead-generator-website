import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { slugify } from '@/lib/utils';
import { wordCount, readingTimeMin, makeExcerpt, buildSeo } from '@/lib/blog/seo';
import { generateContent } from '@/lib/blog/generate';
import { recordAiRun } from '@/lib/prompts/service';
import type { ContentType } from '@/lib/blog/content-types';
import { withWebsiteAiCredentials } from '@/lib/ai/credentials';

/**
 * Blog / content service — the ONLY read/write path for `ContentItem`s, all
 * tenant-access guarded. Independent module; reuses the AI Engine's offline-safe
 * pattern for generation and the SEO helpers for metadata. Never renders pages.
 */

export interface ContentDTO {
  id: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  body: string;
  excerpt: string | null;
  seo: unknown;
  featuredImageId: string | null;
  tags: string[];
  wordCount: number;
  readingTimeMin: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  revisionCount: number;
  updatedAt: string;
}

type Row = {
  id: string; type: string; title: string; slug: string; status: string; body: string;
  excerpt: string | null; seo: unknown; featuredImageId: string | null; tags: string[];
  wordCount: number; readingTimeMin: number; scheduledAt: Date | null; publishedAt: Date | null;
  revisions: unknown; updatedAt: Date;
};

function toDTO(r: Row): ContentDTO {
  return {
    id: r.id, type: r.type, title: r.title, slug: r.slug, status: r.status, body: r.body,
    excerpt: r.excerpt, seo: r.seo, featuredImageId: r.featuredImageId, tags: r.tags,
    wordCount: r.wordCount, readingTimeMin: r.readingTimeMin,
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    revisionCount: Array.isArray(r.revisions) ? r.revisions.length : 0,
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function uniqueSlug(websiteId: string, base: string): Promise<string> {
  const root = slugify(base) || 'content';
  const taken = new Set(
    (await prisma.contentItem.findMany({ where: { websiteId, slug: { startsWith: root } }, select: { slug: true } })).map((c) => c.slug),
  );
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now()}`;
}

/** Extract generator inputs from the website's wizard businessConfig. */
function businessInput(businessConfig: unknown, type: ContentType, topic?: string) {
  const bc = (businessConfig ?? {}) as {
    business?: { businessName?: string; category?: string; primaryService?: string; additionalServices?: string[] };
    location?: { city?: string; state?: string };
  };
  return {
    businessName: bc.business?.businessName ?? 'Your Business',
    category: bc.business?.category,
    primaryService: bc.business?.primaryService,
    services: bc.business?.additionalServices,
    city: bc.location?.city,
    state: bc.location?.state,
    type,
    topic,
  };
}

export async function listContent(websiteId: string): Promise<ContentDTO[]> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const rows = await prisma.contentItem.findMany({ where: { websiteId }, orderBy: { updatedAt: 'desc' }, take: 200 });
  return rows.map(toDTO);
}

export async function getContent(contentId: string): Promise<ContentDTO> {
  const c = await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId } });
  await requireWebsiteAccess(c.websiteId, 'website:view');
  return toDTO(c);
}

export async function generateOne(websiteId: string, type: ContentType, topic?: string): Promise<ContentDTO> {
  await requireWebsiteAccess(websiteId, 'website:update');
  const created = await generateOneCore(websiteId, type, topic);
  // Record the AI run for the user's AI history (Phase 9). Best-effort — never block generation.
  try {
    await recordAiRun({ kind: 'content', prompt: topic ?? `Generate ${type}`, output: created.title, websiteId });
  } catch {
    /* history is non-critical */
  }
  return created;
}

/**
 * System-level generation core (no session auth). Used by `generateOne` (after the
 * tenant-access check) and by the Background Jobs blog handler (authorized at the
 * enqueue site). Single implementation — the queue path does not duplicate it.
 */
export async function generateOneCore(websiteId: string, type: ContentType, topic?: string): Promise<ContentDTO> {
  const w = await prisma.website.findUniqueOrThrow({ where: { id: websiteId }, select: { businessConfig: true } });
  // Honor the workspace's BYO AI key for any live-AI copy inside content generation.
  const gen = await withWebsiteAiCredentials(websiteId, async () =>
    generateContent(businessInput(w.businessConfig, type, topic)),
  );
  const slug = await uniqueSlug(websiteId, gen.title);
  const words = wordCount(gen.body);
  const row = await prisma.contentItem.create({
    data: {
      websiteId, type: type as never, title: gen.title, slug, body: gen.body,
      excerpt: gen.excerpt, tags: gen.tags, wordCount: words, readingTimeMin: readingTimeMin(words),
      seo: buildSeo(gen.title, gen.excerpt) as unknown as object,
    },
  });
  return toDTO(row);
}

export async function generateBulk(websiteId: string, types: ContentType[]): Promise<number> {
  await requireWebsiteAccess(websiteId, 'website:update');
  let created = 0;
  for (const type of types.slice(0, 20)) {
    await generateOne(websiteId, type);
    created += 1;
  }
  return created;
}

export async function updateContent(
  contentId: string,
  patch: { title?: string; body?: string; excerpt?: string; tags?: string[]; featuredImageId?: string | null },
): Promise<ContentDTO> {
  const c = await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId } });
  await requireWebsiteAccess(c.websiteId, 'website:update');

  // Snapshot the current version before overwriting (capped at 20).
  const prior = Array.isArray(c.revisions) ? (c.revisions as unknown[]) : [];
  const revisions = [{ at: new Date().toISOString(), title: c.title, body: c.body }, ...prior].slice(0, 20);

  const body = patch.body ?? c.body;
  const words = wordCount(body);
  const excerpt = patch.excerpt ?? makeExcerpt(body);
  const title = patch.title ?? c.title;

  const row = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      title, body, excerpt, tags: patch.tags ?? c.tags, featuredImageId: patch.featuredImageId ?? c.featuredImageId,
      wordCount: words, readingTimeMin: readingTimeMin(words),
      seo: buildSeo(title, excerpt) as unknown as object,
      revisions: revisions as unknown as object,
    },
  });
  return toDTO(row);
}

export async function setStatus(
  contentId: string,
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED',
  scheduledAt?: Date | null,
): Promise<void> {
  const c = await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId }, select: { websiteId: true } });
  await requireWebsiteAccess(c.websiteId, status === 'PUBLISHED' ? 'website:publish' : 'website:update');
  await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      status,
      scheduledAt: status === 'SCHEDULED' ? scheduledAt ?? null : null,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  });
}

export async function duplicateContent(contentId: string): Promise<ContentDTO> {
  const c = await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId } });
  await requireWebsiteAccess(c.websiteId, 'website:update');
  const title = `${c.title} (Copy)`;
  const slug = await uniqueSlug(c.websiteId, title);
  const row = await prisma.contentItem.create({
    data: {
      websiteId: c.websiteId, type: c.type, title, slug, body: c.body, excerpt: c.excerpt,
      tags: c.tags, wordCount: c.wordCount, readingTimeMin: c.readingTimeMin,
      seo: (c.seo ?? undefined) as object | undefined, status: 'DRAFT',
    },
  });
  return toDTO(row);
}

export async function deleteContent(contentId: string): Promise<void> {
  const c = await prisma.contentItem.findUniqueOrThrow({ where: { id: contentId }, select: { websiteId: true } });
  await requireWebsiteAccess(c.websiteId, 'website:delete');
  await prisma.contentItem.delete({ where: { id: contentId } });
}
