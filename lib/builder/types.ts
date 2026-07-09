import type { ComponentType } from 'react';
import type { BusinessConfig } from '@/lib/generator/schema';
import type {
  ResolvedCity,
  ResolvedService,
  ResolvedState,
} from '@/lib/generator/config';
import type { GeneratedPageContent, PageContext, PageType } from '@/lib/ai/types';

/**
 * Website Builder — core types.
 *
 * The builder turns a business + industry pack + template into JSON-driven,
 * block-based pages rendered under a swappable theme. Every page is a
 * `PageDefinition` (an ordered list of `BlockInstance`s); nothing about the page
 * layout is hardcoded in a route.
 */

// --- Blocks ------------------------------------------------------------------

/** A single block placed on a page: its registered type + its configuration. */
export interface BlockInstance {
  /** Registered block type, e.g. "hero", "faq", "pricing". */
  type: string;
  /** Optional stable id (for ordering/editing). */
  id?: string;
  /** Block-specific configuration (theme/industry aware at render time). */
  props?: Record<string, unknown>;
}

/** A composed page: an ordered list of blocks. */
export interface PageDefinition {
  title?: string;
  blocks: BlockInstance[];
}

/**
 * Everything a block needs to render itself. Built once per page from the
 * PageContext + resolved (AI or deterministic) content, then passed to every
 * block so blocks stay independent, reusable, and context-aware.
 */
export interface BlockContext {
  business: BusinessConfig;
  content: GeneratedPageContent;
  pageType: PageType;
  /** All services + service areas (for grids/links). */
  services: ResolvedService[];
  cities: Array<{ state: ResolvedState; city: ResolvedCity }>;
  /** Resolved entities present for the current page type. */
  service?: ResolvedService;
  state?: ResolvedState;
  city?: ResolvedCity;
  /** The active theme id (blocks may adapt). */
  themeId: ThemeId;
  /** The active industry id. */
  industryId: string;
}

/** Props every block component receives. Uniform so the registry stays typed. */
export interface BlockProps {
  ctx: BlockContext;
  config: Record<string, unknown>;
}

export type BlockComponent = ComponentType<BlockProps>;

// --- Themes ------------------------------------------------------------------

export type ThemeId =
  | 'light'
  | 'dark'
  | 'modern'
  | 'luxury'
  | 'corporate'
  | 'minimal'
  | 'blue-collar'
  | 'medical';

/** Design tokens for a theme. Colors are HSL triplets ("H S% L%"). */
export interface ThemeTokens {
  id: ThemeId;
  name: string;
  dark: boolean;
  colors: {
    background: string;
    foreground: string;
    muted: string;
    mutedFg: string;
    border: string;
    brand: string;
    brandFg: string;
    accent: string;
    accentFg: string;
  };
  radius: string;
  /** Optional font stack applied via --font-sans. */
  font?: string;
}

// --- Industry packs ----------------------------------------------------------

export interface IndustryService {
  name: string;
  shortDescription: string;
  emergency?: boolean;
  startingPrice?: string;
}

export interface IndustryPack {
  id: string;
  name: string;
  /** Business category label, e.g. "Plumbing". */
  category: string;
  /** schema.org LocalBusiness subtype, e.g. "Plumber", "HVACBusiness". */
  schemaType: string;
  /** Domain vocabulary used across copy. */
  terminology: {
    professional: string; // "plumber"
    service: string; // "plumbing service"
    emergencyName: string; // "emergency plumbing"
  };
  services: IndustryService[];
  faqs: Array<{ question: string; answer: string }>;
  /** Keywords to seed image prompts + SEO. */
  imageKeywords: string[];
  blogCategories: string[];
  /** Extra hints appended to AI prompts for this industry. */
  promptHints: string;
  /** Default theme + template when this industry is auto-selected. */
  defaultThemeId: ThemeId;
  defaultTemplateId: string;
}

// --- Templates ---------------------------------------------------------------

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Industry pack this template targets (or "generic"). */
  industryId: string;
  /** Theme applied by default. */
  themeId: ThemeId;
  /**
   * JSON layouts per page type. `home` is required; others fall back to the
   * base template's layout when omitted.
   */
  layouts: Partial<Record<PageType, BlockInstance[]>>;
}

// Re-export for convenience.
export type { PageContext, PageType, GeneratedPageContent };
