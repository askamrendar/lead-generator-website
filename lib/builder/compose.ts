import { baseTemplate } from '@/templates/base';
import type {
  BlockInstance,
  PageDefinition,
  PageType,
  Template,
} from '@/lib/builder/types';

/**
 * Page composer. Resolves the JSON block layout for a page type from a template,
 * inheriting from the base template when the template doesn't override that page.
 * The result is a PageDefinition the render engine turns into a Next.js page —
 * no page layout is hardcoded in a route.
 */
export function composePage(
  template: Template,
  pageType: PageType,
  title?: string,
): PageDefinition {
  const blocks: BlockInstance[] =
    template.layouts[pageType] ??
    baseTemplate.layouts[pageType] ??
    baseTemplate.layouts.home ??
    [];
  return { title, blocks };
}

/** True if the template (or base) has a layout for this page type. */
export function hasLayout(template: Template, pageType: PageType): boolean {
  return Boolean(template.layouts[pageType] ?? baseTemplate.layouts[pageType]);
}
