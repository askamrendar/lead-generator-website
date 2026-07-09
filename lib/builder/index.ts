/**
 * Website Builder — public barrel.
 *
 * Turn a business into a themed, block-driven, JSON-composed website:
 *
 *   business + industry pack  →  selectBuild()  →  template + theme
 *   template + pageType       →  composePage()  →  PageDefinition (JSON blocks)
 *   PageContext + content     →  buildBlockContext()
 *   <ThemeProvider><BlockRenderer page ctx/></ThemeProvider>
 */

export type {
  BlockInstance,
  PageDefinition,
  BlockContext,
  BlockProps,
  BlockComponent,
  ThemeId,
  ThemeTokens,
  IndustryPack,
  Template,
} from '@/lib/builder/types';

export { blockRegistry, getBlock, listBlockTypes, isBlockType } from '@/lib/builder/blocks';
export { themes, getTheme, listThemes, themeCssVars } from '@/themes';
export {
  industryRegistry,
  getIndustry,
  listIndustries,
  matchIndustryByCategory,
} from '@/industries';
export { templateRegistry, getTemplate, listTemplates } from '@/templates/registry';
export { composePage, hasLayout } from '@/lib/builder/compose';
export { buildBlockContext } from '@/lib/builder/context';
export {
  selectBuild,
  aiSelectBuild,
  type BuildSelection,
  type SelectionOverrides,
} from '@/lib/builder/select';
export {
  registries,
  generatorRegistry,
  registrySummary,
  componentRegistry,
  listComponents,
} from '@/lib/builder/registry';
