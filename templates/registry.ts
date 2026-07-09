import type { Template } from '@/lib/builder/types';
import { baseTemplate } from '@/templates/base';
import { plumberTemplate } from '@/templates/plumber';
import { hvacTemplate } from '@/templates/hvac';
import { genericTemplate } from '@/templates/generic';

/**
 * Template registry. Templates are pure data (theme + industry + JSON layouts).
 * Adding a vertical template (roofing, electrician, cleaning, …) is a single
 * file + one entry here.
 */
export const templateRegistry: Record<string, Template> = {
  base: baseTemplate,
  plumber: plumberTemplate,
  hvac: hvacTemplate,
  generic: genericTemplate,
};

export function getTemplate(id: string): Template {
  return templateRegistry[id] ?? baseTemplate;
}

export function listTemplates(): Template[] {
  return Object.values(templateRegistry);
}
