import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { selectBuild } from '@/lib/builder/select';
import { composePage } from '@/lib/builder/compose';
import { business as sampleBusiness } from '@/data/business';
import { businessFromWizard } from '@/lib/websites/render-service';
import { normalizeDocument, publish as publishDoc, snapshot } from '@/lib/builder/editor/document';
import type { BuilderDocument } from '@/lib/builder/editor/types';
import type { PageDefinition, ThemeId } from '@/lib/builder/types';

/**
 * Builder persistence — the ONLY read/write path for a website's `builderConfig`.
 * Every call goes through the tenant-access layer (`requireWebsiteAccess`), so
 * authorization + tenant scoping are centralized. It edits configuration only; the
 * generation engines are untouched and rendering stays in `BlockRenderer`.
 *
 * On first open, `builderConfig` is seeded with a real starter `PageDefinition`
 * (`composePage`) derived from THE WEBSITE'S OWN business config — the sample
 * business is only the fallback when no valid config exists, so the editor never
 * opens empty.
 */

/** A stable seed page + default theme derived from the website's own config. */
function seed(businessConfig: unknown): { page: PageDefinition; themeId: ThemeId } {
  const business = businessFromWizard(businessConfig) ?? sampleBusiness;
  const selection = selectBuild(business, {});
  const page = composePage(selection.template, 'home', 'Home');
  return { page, themeId: selection.themeId };
}

export async function getBuilderDocument(websiteId: string): Promise<BuilderDocument> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { builderConfig: true, businessConfig: true },
  });
  const { page, themeId } = seed(w.businessConfig);
  return normalizeDocument(w.builderConfig, page, themeId);
}

export async function saveBuilderDocument(
  websiteId: string,
  doc: BuilderDocument,
): Promise<void> {
  await requireWebsiteAccess(websiteId, 'website:update');
  await saveBuilderDocumentCore(websiteId, doc);
}

/**
 * System-level writer (no session auth) — the SINGLE place `builderConfig` is written
 * for the raw document. Used by `saveBuilderDocument` (after the tenant-access check)
 * and by the Background Jobs `website.generate` handler (authorized at the enqueue
 * site). Keeps builder-service the only writer; the queue path does not duplicate it.
 */
export async function saveBuilderDocumentCore(
  websiteId: string,
  doc: BuilderDocument,
): Promise<void> {
  await prisma.website.update({
    where: { id: websiteId },
    data: { builderConfig: doc as unknown as object },
  });
}

export async function publishBuilderDocument(
  websiteId: string,
  doc: BuilderDocument,
  now: string,
  revisionId: string,
): Promise<BuilderDocument> {
  await requireWebsiteAccess(websiteId, 'website:publish');
  // Snapshot the state being published, then flip status + copy to `published`.
  const withRevision = snapshot(doc, revisionId, now, 'Published');
  const published = publishDoc(withRevision, now);
  await prisma.website.update({
    where: { id: websiteId },
    data: {
      builderConfig: published as unknown as object,
      status: 'PUBLISHED',
      generatedAt: new Date(now),
    },
  });
  return published;
}
