import type { Template } from '@/lib/builder/types';

/** Generic template — minimal theme, clean layout for any local service. */
export const genericTemplate: Template = {
  id: 'generic',
  name: 'Generic',
  description: 'Minimal, no-frills layout that works for any industry.',
  industryId: 'generic',
  themeId: 'minimal',
  layouts: {
    home: [
      { type: 'hero' },
      { type: 'trust-badges' },
      { type: 'benefits' },
      { type: 'service-grid' },
      { type: 'location-grid', props: { limit: 6 } },
      { type: 'reviews' },
      { type: 'faq' },
      { type: 'cta' },
    ],
  },
};
