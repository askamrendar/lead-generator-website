import { blockRegistry } from '@/lib/builder/blocks/registry';
import { themes } from '@/themes/registry';
import { industryRegistry } from '@/industries/registry';
import { templateRegistry } from '@/templates/registry';
import { composePage } from '@/lib/builder/compose';
import { componentRegistry, listComponents } from '@/lib/builder/registry/components';
import type { PageDefinition, PageType, Template } from '@/lib/builder/types';

/**
 * Central registries for the Website Builder. Everything the builder can render
 * is discoverable here:
 *
 *  - section   → block types (the JSON page vocabulary)
 *  - component → reusable UI primitives
 *  - theme     → design-token themes
 *  - industry  → vertical packs
 *  - template  → JSON page layouts
 *  - generator → page-type → composer function
 */

export type GeneratorFn = (template: Template) => PageDefinition;

const PAGE_TYPES: PageType[] = [
  'home',
  'about',
  'contact',
  'faq',
  'service',
  'serviceCity',
  'city',
  'state',
  'county',
  'zip',
  'neighborhood',
];

export const generatorRegistry: Record<PageType, GeneratorFn> = PAGE_TYPES.reduce(
  (acc, pageType) => {
    acc[pageType] = (template: Template) => composePage(template, pageType);
    return acc;
  },
  {} as Record<PageType, GeneratorFn>,
);

export const registries = {
  section: blockRegistry,
  component: componentRegistry,
  theme: themes,
  industry: industryRegistry,
  template: templateRegistry,
  generator: generatorRegistry,
} as const;

/** A one-glance summary of what the builder can produce. */
export function registrySummary() {
  return {
    sections: Object.keys(blockRegistry).length,
    components: listComponents().length,
    themes: Object.keys(themes).length,
    industries: Object.keys(industryRegistry).length,
    templates: Object.keys(templateRegistry).length,
    pageGenerators: Object.keys(generatorRegistry).length,
  };
}

export { componentRegistry, listComponents };
