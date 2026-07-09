import type { BlockInstance, Template } from '@/lib/builder/types';

/**
 * Base template — the default JSON layouts every other template inherits from.
 * A "template" is just data: an ordered list of block instances per page type.
 * Override any layout in a child template; unspecified layouts fall back here.
 */

const homeLayout: BlockInstance[] = [
  { type: 'hero' },
  { type: 'trust-badges' },
  { type: 'stats' },
  { type: 'benefits' },
  { type: 'service-grid' },
  { type: 'timeline' },
  { type: 'location-grid', props: { limit: 6 } },
  { type: 'testimonials' },
  { type: 'pricing' },
  { type: 'faq' },
  { type: 'lead-form' },
  { type: 'cta' },
];

const serviceLayout: BlockInstance[] = [
  { type: 'hero' },
  { type: 'benefits' },
  { type: 'timeline' },
  { type: 'problems' },
  { type: 'gallery' },
  { type: 'pricing' },
  { type: 'faq' },
  { type: 'related-services' },
  { type: 'related-locations' },
  { type: 'cta' },
];

const serviceCityLayout: BlockInstance[] = [
  { type: 'hero' },
  { type: 'stats' },
  { type: 'emergency-banner' },
  { type: 'problems' },
  { type: 'benefits' },
  { type: 'faq' },
  { type: 'map' },
  { type: 'related-services' },
  { type: 'related-locations' },
  { type: 'cta' },
];

const locationLayout: BlockInstance[] = [
  { type: 'hero' },
  { type: 'trust-badges' },
  { type: 'service-grid' },
  { type: 'testimonials' },
  { type: 'map' },
  { type: 'related-locations' },
  { type: 'faq' },
  { type: 'cta' },
];

const aboutLayout: BlockInstance[] = [
  { type: 'hero' },
  { type: 'stats' },
  { type: 'benefits' },
  { type: 'team' },
  { type: 'testimonials' },
  { type: 'cta' },
];

export const baseTemplate: Template = {
  id: 'base',
  name: 'Base',
  description: 'Balanced, conversion-focused layouts that suit any local service.',
  industryId: 'generic',
  themeId: 'modern',
  layouts: {
    home: homeLayout,
    about: aboutLayout,
    service: serviceLayout,
    serviceCity: serviceCityLayout,
    city: locationLayout,
    state: locationLayout,
    county: locationLayout,
    zip: locationLayout,
    neighborhood: locationLayout,
  },
};

export { homeLayout, serviceLayout, serviceCityLayout, locationLayout, aboutLayout };
