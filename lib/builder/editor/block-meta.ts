import { listBlockTypes } from '@/lib/builder/blocks/registry';

/**
 * Editor-facing metadata for each block type: a human label, category (for the block
 * library + search), and which prop keys are editable text / rich-text / image. This
 * is presentational metadata ONLY — blocks still render from the registry; nothing
 * here duplicates rendering. Unknown-but-registered blocks fall back to a default.
 */
export type FieldKind = 'text' | 'richtext' | 'image';

export interface BlockField {
  key: string;
  label: string;
  kind: FieldKind;
}

export interface BlockMeta {
  type: string;
  label: string;
  category: 'Content' | 'Media' | 'Social' | 'Action' | 'Layout';
  fields: BlockField[];
}

const META: Record<string, Omit<BlockMeta, 'type'>> = {
  hero: { label: 'Hero', category: 'Content', fields: [{ key: 'eyebrow', label: 'Eyebrow', kind: 'text' }] },
  'rich-text': { label: 'Rich Text', category: 'Content', fields: [{ key: 'title', label: 'Title', kind: 'text' }, { key: 'text', label: 'Body', kind: 'richtext' }] },
  benefits: { label: 'Benefits', category: 'Content', fields: [{ key: 'eyebrow', label: 'Eyebrow', kind: 'text' }, { key: 'title', label: 'Title', kind: 'text' }] },
  problems: { label: 'Problems', category: 'Content', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  stats: { label: 'Stats', category: 'Content', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'trust-badges': { label: 'Trust Badges', category: 'Content', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  reviews: { label: 'Reviews', category: 'Social', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  testimonials: { label: 'Testimonials', category: 'Social', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  timeline: { label: 'Timeline', category: 'Social', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  team: { label: 'Team', category: 'Social', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  pricing: { label: 'Pricing', category: 'Media', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'before-after': { label: 'Before / After', category: 'Media', fields: [{ key: 'beforeImage', label: 'Before image', kind: 'image' }, { key: 'afterImage', label: 'After image', kind: 'image' }] },
  gallery: { label: 'Gallery', category: 'Media', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'service-grid': { label: 'Service Grid', category: 'Action', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'location-grid': { label: 'Location Grid', category: 'Action', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'related-services': { label: 'Related Services', category: 'Action', fields: [] },
  'related-locations': { label: 'Related Locations', category: 'Action', fields: [] },
  faq: { label: 'FAQ', category: 'Action', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  'lead-form': { label: 'Lead Form', category: 'Action', fields: [{ key: 'title', label: 'Title', kind: 'text' }] },
  map: { label: 'Map', category: 'Action', fields: [] },
  cta: { label: 'Call To Action', category: 'Action', fields: [{ key: 'title', label: 'Title', kind: 'text' }, { key: 'subtitle', label: 'Subtitle', kind: 'text' }] },
  'emergency-banner': { label: 'Emergency Banner', category: 'Action', fields: [{ key: 'text', label: 'Text', kind: 'text' }] },
};

const FALLBACK: Omit<BlockMeta, 'type'> = { label: 'Block', category: 'Layout', fields: [{ key: 'title', label: 'Title', kind: 'text' }] };

export function blockMeta(type: string): BlockMeta {
  return { type, ...(META[type] ?? FALLBACK) };
}

/** Every registered block, with editor metadata (drives the block library). */
export function allBlockMeta(): BlockMeta[] {
  return listBlockTypes().map(blockMeta);
}

export function humanizeBlockType(type: string): string {
  return blockMeta(type).label;
}
