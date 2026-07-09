import type { BusinessConfig } from '@/lib/generator/schema';
import { getAIConfig } from '@/lib/ai/config';
import { getProvider } from '@/lib/ai/providers';
import {
  getIndustry,
  listIndustries,
  matchIndustryByCategory,
} from '@/lib/builder/industries';
import { getTemplate, listTemplates, templateRegistry } from '@/templates/registry';
import { getTheme, listThemes } from '@/lib/builder/themes/registry';
import type { IndustryPack, Template, ThemeId } from '@/lib/builder/types';

/**
 * Template / theme / industry selection.
 *
 * `selectBuild` is the deterministic, offline-safe heuristic: match the business
 * category to an industry pack, then use that pack's default template + theme.
 * `aiSelectBuild` optionally asks the configured AI provider to choose from the
 * available registries, falling back to the heuristic on any error.
 */

export interface BuildSelection {
  industry: IndustryPack;
  template: Template;
  themeId: ThemeId;
}

export interface SelectionOverrides {
  templateId?: string;
  themeId?: ThemeId;
  industryId?: string;
}

export function selectBuild(
  business: BusinessConfig,
  overrides: SelectionOverrides = {},
): BuildSelection {
  const industry = overrides.industryId
    ? getIndustry(overrides.industryId)
    : matchIndustryByCategory(business.category);

  const template = overrides.templateId
    ? getTemplate(overrides.templateId)
    : getTemplate(industry.defaultTemplateId);

  const themeId: ThemeId =
    overrides.themeId ?? template.themeId ?? industry.defaultThemeId;

  // Normalize the theme id through the registry so an unknown id can't slip in.
  return { industry, template, themeId: getTheme(themeId).id };
}

/**
 * AI-driven selection. Asks the provider to pick a template + theme + industry
 * from the available options. Deterministically falls back to `selectBuild`.
 */
export async function aiSelectBuild(
  business: BusinessConfig,
  overrides: SelectionOverrides = {},
): Promise<BuildSelection & { source: 'ai' | 'heuristic' }> {
  const heuristic = selectBuild(business, overrides);
  const config = getAIConfig();
  const provider = getProvider();
  if (!config.enabled || !provider.isConfigured()) {
    return { ...heuristic, source: 'heuristic' };
  }

  const templates = listTemplates().map((t) => `${t.id} (${t.description})`);
  const themeIds = listThemes().map((t) => t.id);
  const industryIds = listIndustries().map((p) => p.id);

  const prompt = [
    `Business: ${business.name} — category "${business.category}".`,
    `Choose the best design for its website.`,
    `Templates: ${templates.join('; ')}.`,
    `Themes: ${themeIds.join(', ')}.`,
    `Industries: ${industryIds.join(', ')}.`,
    `Return JSON {"templateId": string, "themeId": string, "industryId": string}.`,
  ].join('\n');

  try {
    const res = await provider.complete({
      prompt,
      json: true,
      temperature: 0.2,
      maxTokens: 200,
      model: config.model,
    });
    const parsed = JSON.parse(res.text) as Partial<SelectionOverrides>;
    const merged = selectBuild(business, {
      templateId:
        parsed.templateId && parsed.templateId in templateRegistry
          ? parsed.templateId
          : overrides.templateId,
      themeId: (parsed.themeId as ThemeId) ?? overrides.themeId,
      industryId: parsed.industryId ?? overrides.industryId,
    });
    return { ...merged, source: 'ai' };
  } catch {
    return { ...heuristic, source: 'heuristic' };
  }
}
