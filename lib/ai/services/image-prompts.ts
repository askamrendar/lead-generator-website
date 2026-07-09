import type { ImagePrompt, PageContext } from '@/lib/ai/types';

/**
 * Image-prompt engine. Produces text-to-image prompts (for DALL·E / Imagen /
 * SDXL / Midjourney) plus alt text, kept SEPARATE from page copy. Deterministic
 * and offline — no API needed to produce the prompts themselves.
 */

function subject(ctx: PageContext): string {
  const cat = ctx.business.category.toLowerCase();
  if (ctx.service) return `a professional ${ctx.service.name.toLowerCase()} technician at work`;
  return `a friendly, professional ${cat} technician on a service call`;
}

function place(ctx: PageContext): string {
  return ctx.placeName ? ` in ${ctx.placeName}` : '';
}

const STYLE =
  'photorealistic, natural daylight, clean composition, high detail, trustworthy and premium brand feel, no text, no logos, no watermarks';

export function buildImagePrompts(ctx: PageContext): ImagePrompt[] {
  const b = ctx.business;
  const cat = b.category.toLowerCase();
  const prompts: ImagePrompt[] = [
    {
      slot: 'hero',
      aspect: '16:9',
      prompt: `Hero image: ${subject(ctx)}${place(ctx)}, branded uniform, modern equipment, ${STYLE}`,
      alt: `${b.name} — ${ctx.service?.name ?? b.primaryService}${place(ctx)}`,
    },
    {
      slot: 'og',
      aspect: '1.91:1',
      prompt: `Open Graph social image: confident ${cat} professional${place(ctx)}, space for a headline overlay, ${STYLE}`,
      alt: `${ctx.title} — ${b.name}`,
    },
    {
      slot: 'service',
      aspect: '4:3',
      prompt: `Close-up of ${ctx.service?.name.toLowerCase() ?? `${cat} work`} being performed correctly, tools in frame, ${STYLE}`,
      alt: `${ctx.service?.name ?? b.category} service by ${b.name}`,
    },
    {
      slot: 'location',
      aspect: '4:3',
      prompt: `Service van parked outside a typical residential home${place(ctx)}, tidy neighborhood, ${STYLE}`,
      alt: `${b.name} serving ${ctx.placeName}`,
    },
    {
      slot: 'before-after',
      aspect: '1:1',
      prompt: `Split before-and-after comparison of a ${cat} repair, clear improvement, ${STYLE}`,
      alt: `Before and after ${cat} work by ${b.name}`,
    },
    {
      slot: 'gallery-1',
      aspect: '4:3',
      prompt: `Detail shot of finished, high-quality ${cat} workmanship, ${STYLE}`,
      alt: `${b.name} completed work`,
    },
    {
      slot: 'icon',
      aspect: '1:1',
      prompt: `Simple flat vector icon representing ${ctx.service?.name.toLowerCase() ?? cat}, two-tone, minimal, on transparent background`,
      alt: `${ctx.service?.name ?? b.category} icon`,
    },
    {
      slot: 'background',
      aspect: '16:9',
      prompt: `Subtle abstract background texture in the brand color, very soft, low contrast, ${STYLE}`,
      alt: 'Decorative background',
    },
  ];
  return prompts;
}
