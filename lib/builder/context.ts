import { getCities, getServices } from '@/lib/generator/config';
import type { GeneratedPageContent, PageContext } from '@/lib/ai/types';
import type { BlockContext, ThemeId } from '@/lib/builder/types';

/**
 * Build the shared BlockContext once per page from the page context + its
 * resolved content. Every block receives this, so blocks never fetch or resolve
 * anything themselves — they just render.
 */
export function buildBlockContext(
  pageCtx: PageContext,
  content: GeneratedPageContent,
  themeId: ThemeId,
  industryId: string,
): BlockContext {
  return {
    business: pageCtx.business,
    content,
    pageType: pageCtx.pageType,
    services: getServices(pageCtx.business),
    cities: getCities(pageCtx.business),
    service: pageCtx.service,
    state: pageCtx.state,
    city: pageCtx.city,
    themeId,
    industryId,
  };
}
