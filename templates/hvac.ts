import type { Template } from '@/lib/builder/types';

/** HVAC template — corporate theme, emphasizes pricing/financing + seasonality. */
export const hvacTemplate: Template = {
  id: 'hvac',
  name: 'HVAC',
  description: 'Corporate, comfort-focused layout highlighting pricing and financing.',
  industryId: 'hvac',
  themeId: 'corporate',
  layouts: {
    home: [
      { type: 'hero' },
      { type: 'trust-badges' },
      { type: 'benefits' },
      { type: 'stats' },
      { type: 'service-grid' },
      { type: 'pricing' },
      { type: 'timeline' },
      { type: 'location-grid', props: { limit: 6 } },
      { type: 'reviews' },
      { type: 'faq' },
      { type: 'lead-form' },
      { type: 'cta' },
    ],
  },
};
