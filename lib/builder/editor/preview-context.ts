import { business as sampleBusiness } from '@/data/business';
import { buildHomeContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { buildBlockContext } from '@/lib/builder/context';
import { selectBuild } from '@/lib/builder/select';
import type { BlockContext, ThemeId } from '@/lib/builder/types';

/**
 * Builds the `BlockContext` the live preview needs, REUSING the existing render
 * pipeline (`buildHomeContext` → `resolvePageContent` → `buildBlockContext`). Until
 * per-website AI generation exists, preview is backed by the sample business +
 * deterministic content (honest demo data) — the editor still edits the real
 * `builderConfig`. No rendering logic is duplicated here.
 */
export async function buildPreviewContext(themeId: ThemeId): Promise<BlockContext> {
  const pageCtx = buildHomeContext(sampleBusiness);
  const { content } = await resolvePageContent(pageCtx);
  const industryId = selectBuild(sampleBusiness, {}).industry.id;
  return buildBlockContext(pageCtx, content, themeId, industryId);
}
