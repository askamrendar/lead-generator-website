import {
  HeroBlock,
  RichTextBlock,
  BenefitsBlock,
  ProblemsBlock,
  StatsBlock,
  TrustBadgesBlock,
} from '@/components/blocks/content-blocks';
import {
  ReviewsBlock,
  TestimonialsBlock,
  TimelineBlock,
  TeamBlock,
} from '@/components/blocks/social-blocks';
import {
  PricingBlock,
  BeforeAfterBlock,
  GalleryBlock,
} from '@/components/blocks/media-blocks';
import {
  ServiceGridBlock,
  LocationGridBlock,
  RelatedServicesBlock,
  RelatedLocationsBlock,
  FaqBlock,
  LeadFormBlock,
  MapBlock,
  CtaBlock,
  EmergencyBannerBlock,
} from '@/components/blocks/action-blocks';
import type { BlockComponent } from '@/lib/builder/types';

/**
 * Block registry — the section/component registry for the page builder. Maps a
 * block `type` string (used in JSON page definitions) to its React component.
 * Adding a block = adding one entry here; pages reference it by name.
 */
export const blockRegistry: Record<string, BlockComponent> = {
  hero: HeroBlock,
  'rich-text': RichTextBlock,
  benefits: BenefitsBlock,
  problems: ProblemsBlock,
  stats: StatsBlock,
  'trust-badges': TrustBadgesBlock,
  reviews: ReviewsBlock,
  testimonials: TestimonialsBlock,
  timeline: TimelineBlock,
  team: TeamBlock,
  pricing: PricingBlock,
  'before-after': BeforeAfterBlock,
  gallery: GalleryBlock,
  'service-grid': ServiceGridBlock,
  'location-grid': LocationGridBlock,
  'related-services': RelatedServicesBlock,
  'related-locations': RelatedLocationsBlock,
  faq: FaqBlock,
  'lead-form': LeadFormBlock,
  map: MapBlock,
  cta: CtaBlock,
  'emergency-banner': EmergencyBannerBlock,
};

export type BlockType = keyof typeof blockRegistry;

export function getBlock(type: string): BlockComponent | undefined {
  return blockRegistry[type];
}

export function listBlockTypes(): string[] {
  return Object.keys(blockRegistry);
}

export function isBlockType(type: string): boolean {
  return type in blockRegistry;
}
