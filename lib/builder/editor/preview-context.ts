import { business as sampleBusiness } from '@/data/business';
import { buildHomeContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { buildBlockContext } from '@/lib/builder/context';
import { selectBuild } from '@/lib/builder/select';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { BlockContext, ThemeId } from '@/lib/builder/types';

/**
 * Builds the `BlockContext` the Visual Builder's live preview needs, REUSING the
 * existing render pipeline (`buildHomeContext` → `resolvePageContent` →
 * `buildBlockContext`). The preview renders the WEBSITE'S OWN business config
 * (resolved by the caller via `businessFromWizard`); the sample business is only a
 * last-resort fallback for a website with no valid business configuration yet, so
 * the editor never renders an empty canvas.
 */
export async function buildPreviewContext(
  themeId: ThemeId,
  business: BusinessConfig | null = null,
): Promise<BlockContext> {
  const config = business ?? sampleBusiness;
  const pageCtx = buildHomeContext(config);
  const { content } = await resolvePageContent(pageCtx);
  const industryId = selectBuild(config, {}).industry.id;
  return buildBlockContext(pageCtx, content, themeId, industryId);
}
