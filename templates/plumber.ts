import type { Template } from '@/lib/builder/types';

/** Plumber template — blue-collar theme, leads with 24/7 emergency response. */
export const plumberTemplate: Template = {
  id: 'plumber',
  name: 'Plumber',
  description: 'Trust-forward layout that leads with emergency availability.',
  industryId: 'plumbing',
  themeId: 'blue-collar',
  layouts: {
    home: [
      { type: 'hero', props: { eyebrow: '24/7 Emergency Service' } },
      { type: 'emergency-banner' },
      { type: 'trust-badges' },
      { type: 'stats' },
      { type: 'benefits' },
      { type: 'service-grid' },
      { type: 'timeline' },
      { type: 'location-grid', props: { limit: 6 } },
      { type: 'testimonials' },
      { type: 'faq' },
      { type: 'lead-form' },
      { type: 'cta' },
    ],
    // service / location / about layouts inherit from base.
  },
};
