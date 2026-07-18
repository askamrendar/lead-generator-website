import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { businessFromWizard } from '@/lib/websites/render-service';
import { enumerateContentPages } from '@/lib/htmlgen/engine';
import { resolvePageContent } from '@/lib/ai/render';
import {
  parseContentOverrides,
  pageOverrideSchema,
  type ContentOverrides,
  type PageOverride,
} from '@/lib/websites/content-overrides';
import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * Site Editor service — the ONLY read/write path for `Website.contentOverrides`.
 * The editor lists every page the engine serves (same enumeration, no duplicate
 * route logic), shows the CURRENT effective content (AI/deterministic), and saves
 * per-page patches. Served pages pick overrides up on the next render — no
 * regeneration step, and template switching keeps working (overrides are
 * content, not markup).
 */

export interface EditorPage {
  path: string;
  label: string;
  group: 'core' | 'service' | 'area';
  /** The engine's current content for the page (before override). */
  content: GeneratedPageContent;
  /** The saved override patch, if any. */
  override: PageOverride | null;
}

export interface EditorData {
  websiteId: string;
  websiteName: string;
  pages: EditorPage[];
}

/** Load everything the Site Editor needs. */
export async function getEditorData(websiteId: string): Promise<EditorData | null> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const row = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { name: true, businessConfig: true, contentOverrides: true },
  });
  const business = businessFromWizard(row.businessConfig);
  if (!business) return null;

  const overrides = parseContentOverrides(row.contentOverrides);
  const refs = enumerateContentPages(business);
  const pages: EditorPage[] = [];
  for (const ref of refs) {
    const { content } = await resolvePageContent(ref.ctx);
    pages.push({
      path: ref.path,
      label: ref.label,
      group: ref.group,
      content,
      override: overrides[ref.path] ?? null,
    });
  }
  return { websiteId, websiteName: row.name, pages };
}

/**
 * Save one page's override patch. An empty patch clears the override (falls
 * back to generated content). Validated with the shared zod schema.
 */
export async function savePageOverride(
  websiteId: string,
  path: string,
  patch: unknown,
): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  const parsed = pageOverrideSchema.parse(patch ?? {});

  const row = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { contentOverrides: true },
  });
  const overrides: ContentOverrides = parseContentOverrides(row.contentOverrides);

  // Drop fields whose values are empty; drop the page when nothing remains.
  const cleaned = Object.fromEntries(
    Object.entries(parsed).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null,
    ),
  ) as PageOverride;

  if (Object.keys(cleaned).length === 0) delete overrides[path];
  else overrides[path] = cleaned;

  await prisma.website.update({
    where: { id: websiteId },
    data: { contentOverrides: overrides as unknown as object },
  });
}
