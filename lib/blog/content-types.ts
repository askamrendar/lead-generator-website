/**
 * Content-type catalog (pure) — the kinds of content the Blog Generator produces.
 * Mirrors the Prisma `ContentType` enum. Drives the generator UI's type picker.
 */
export type ContentType =
  | 'SERVICE'
  | 'CITY'
  | 'AREA'
  | 'NEIGHBORHOOD'
  | 'LOCATION'
  | 'FAQ'
  | 'COMPARISON'
  | 'EDUCATIONAL'
  | 'RESOURCE'
  | 'CASE_STUDY'
  | 'PRESS_RELEASE'
  | 'LANDING'
  | 'SUPPORTING'
  | 'ARTICLE';

export interface ContentTypeMeta {
  id: ContentType;
  label: string;
  description: string;
}

export const CONTENT_TYPES: ContentTypeMeta[] = [
  { id: 'SERVICE', label: 'Service Page', description: 'A page for one service you offer.' },
  { id: 'CITY', label: 'City Page', description: 'Targets a city you serve.' },
  { id: 'AREA', label: 'Area Page', description: 'A broader service area.' },
  { id: 'NEIGHBORHOOD', label: 'Neighborhood Page', description: 'Hyper-local neighborhood targeting.' },
  { id: 'LOCATION', label: 'Location Page', description: 'A physical location or branch.' },
  { id: 'FAQ', label: 'FAQ Page', description: 'Common questions + answers (FAQ schema).' },
  { id: 'COMPARISON', label: 'Comparison Page', description: 'Compare options/competitors.' },
  { id: 'EDUCATIONAL', label: 'Educational Article', description: 'How-to / explainer content.' },
  { id: 'RESOURCE', label: 'Resource Guide', description: 'A comprehensive guide.' },
  { id: 'CASE_STUDY', label: 'Case Study', description: 'A customer success story.' },
  { id: 'PRESS_RELEASE', label: 'Press Release', description: 'Announcement / news.' },
  { id: 'LANDING', label: 'Landing Page', description: 'Conversion-focused campaign page.' },
  { id: 'SUPPORTING', label: 'Supporting Page', description: 'Topic-cluster supporting content.' },
  { id: 'ARTICLE', label: 'Blog Article', description: 'A general blog post.' },
];

export function contentTypeLabel(id: string): string {
  return CONTENT_TYPES.find((t) => t.id === id)?.label ?? id;
}
