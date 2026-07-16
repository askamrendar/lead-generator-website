import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import { parseBusinessConfig } from '@/lib/generator/schema';
import { wizardToBusinessConfig } from '@/lib/websites/business-adapter';
import { aiSelectBuild } from '@/lib/builder/select';
import { composePage } from '@/lib/builder/compose';
import { normalizeDocument } from '@/lib/builder/editor/document';
import { saveBuilderDocumentCore } from '@/lib/websites/builder-service';
import { isAIEnabled } from '@/lib/ai/config';
import { generateWebsite as aiGenerateWebsite } from '@/lib/ai/generation';
import { logger } from '@/lib/logger';
import type { WebsiteWizardInput } from '@/lib/websites/schema';

/**
 * AI Website Generator service (Task 1).
 *
 * Wires the DASHBOARD into the EXISTING engines — it does NOT reimplement generation:
 *   wizard businessConfig
 *     → wizardToBusinessConfig (adapter)      [lib/websites/business-adapter]
 *     → aiSelectBuild (industry/template/theme)[lib/builder/select]  (AI or heuristic)
 *     → composePage (home PageDefinition)      [lib/builder/compose]
 *     → normalizeDocument + saveBuilderDocumentCore [lib/builder/editor + builder-service]
 *     → Website.status = GENERATED
 *
 * Persistence goes through builder-service's writer (the ONLY writer of builderConfig),
 * so the Visual Builder opens the generated page with no new format. Content copy is
 * synthesized by the builder blocks' existing content engine at render time; the Blog
 * generator (already queue-wired) covers article/page content separately.
 */

export interface GenerateResult {
  websiteId: string;
  generated: boolean;
  templateId: string;
  themeId: string;
  industryId: string;
  selectionSource: 'ai' | 'heuristic';
}

/**
 * System-level generation core (no session auth). Used by `generateWebsite` (after the
 * tenant-access check) and by the Background Jobs `website.generate` handler (authorized
 * at the enqueue site). Single implementation — the queue path does not duplicate it.
 */
export async function generateWebsiteCore(websiteId: string): Promise<GenerateResult> {
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { businessConfig: true, builderConfig: true },
  });

  if (!w.businessConfig) {
    throw new Error('Website has no business configuration to generate from.');
  }

  // Adapter → validated generator config (schema fills defaults / validates).
  const businessInput = wizardToBusinessConfig(w.businessConfig as WebsiteWizardInput);
  const business = parseBusinessConfig(businessInput);

  // Reuse the existing selection engine (AI if configured, else deterministic).
  const selection = await aiSelectBuild(business);

  // Compose the home page via the existing composer, then normalize into a
  // BuilderDocument through the canonical helper and persist via the ONLY writer.
  const homePage = composePage(selection.template, 'home', `${business.name} — Home`);
  const doc = normalizeDocument(w.builderConfig, homePage, selection.themeId);
  const generatedDoc = { ...doc, page: homePage, themeId: selection.themeId, status: 'DRAFT' as const };

  await saveBuilderDocumentCore(websiteId, generatedDoc);

  await prisma.website.update({
    where: { id: websiteId },
    data: {
      status: 'GENERATED',
      generatedAt: new Date(),
      themeId: selection.themeId,
      templateId: selection.template.id,
      industryId: selection.industry.id,
    },
  });

  logger.info('website generated', {
    websiteId,
    templateId: selection.template.id,
    themeId: selection.themeId,
    source: selection.source,
  });

  // M6 — warm the per-website AI content cache when a live provider is configured.
  // The cache is keyed by businessConfigHash (already multi-tenant-safe), so this
  // pre-generates unique copy for the site's core pages via the EXISTING engine
  // batch. Offline mode skips silently — the deterministic fallback keeps working
  // and the AI Generator tab shows an honest offline banner instead.
  if (isAIEnabled()) {
    try {
      const summary = await aiGenerateWebsite(business, 'core');
      logger.info('website content cache warmed', {
        websiteId,
        total: summary.total,
        ai: summary.ai,
        fallback: summary.fallback,
        errors: summary.errors,
      });
    } catch (err) {
      // Never fail generation over cache warming — pages fall back per-request.
      logger.warn('website content warm failed', { websiteId, error: String(err) });
    }
  }

  return {
    websiteId,
    generated: true,
    templateId: selection.template.id,
    themeId: selection.themeId,
    industryId: selection.industry.id,
    selectionSource: selection.source,
  };
}

/** Session-guarded entry point used by the dashboard server action. */
export async function generateWebsite(websiteId: string): Promise<GenerateResult> {
  await requireWebsiteAccess(websiteId, 'website:update');
  return generateWebsiteCore(websiteId);
}
