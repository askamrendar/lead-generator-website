import type { BusinessConfig } from '@/lib/generator/schema';
import type {
  ResolvedCity,
  ResolvedCounty,
  ResolvedNeighborhood,
  ResolvedService,
  ResolvedState,
  ResolvedZip,
} from '@/lib/generator/config';

/**
 * AI Content Engine — shared types.
 *
 * The engine is provider-agnostic: pages/agents describe *what* they need
 * (a PageContext) and receive a fully-populated GeneratedPageContent, without
 * knowing which provider produced it. The deterministic Phase-1/2 engine is the
 * offline fallback provider, so nothing here requires an API key to compile or
 * run.
 */

export type PageType =
  | 'home'
  | 'about'
  | 'contact'
  | 'faq'
  | 'service'
  | 'city'
  | 'state'
  | 'county'
  | 'neighborhood'
  | 'zip'
  | 'serviceCity';

/** Everything an agent needs to write a single page, resolved from the config. */
export interface PageContext {
  pageType: PageType;
  business: BusinessConfig;
  /** Canonical site-relative path for this page. */
  path: string;
  /** Short human label, e.g. "Drain Cleaning in Austin, TX". */
  title: string;
  /** Primary place label for location-aware copy, e.g. "Austin, TX". */
  placeName: string;
  // Optional resolved entities (present depending on pageType).
  service?: ResolvedService;
  state?: ResolvedState;
  city?: ResolvedCity;
  county?: ResolvedCounty;
  neighborhood?: ResolvedNeighborhood;
  zip?: ResolvedZip;
}

export interface ProcessStep {
  title: string;
  description: string;
}
export interface Faq {
  question: string;
  answer: string;
}
export interface ProblemSolution {
  problem: string;
  solution: string;
}
export interface GeneratedReview {
  author: string;
  rating: number;
  body: string;
  location?: string;
}
export interface Stat {
  value: string;
  label: string;
}
export interface CtaBlock {
  title: string;
  description: string;
}
export interface EmergencyBlock {
  title: string;
  description: string;
}
export interface LinkAnchor {
  label: string;
  href: string;
}
export interface ImagePrompt {
  /** Slot identifier, e.g. "hero", "og", "gallery-1". */
  slot: string;
  /** Text-to-image prompt. */
  prompt: string;
  /** Recommended alt text for the rendered image. */
  alt: string;
  /** Target aspect, e.g. "16:9". */
  aspect?: string;
}

/** The complete, structured content object for any generated page. */
export interface GeneratedPageContent {
  seoTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroCopy: string;
  intro: string;
  benefits: string[];
  problems: ProblemSolution[];
  whyChooseUs: string[];
  process: ProcessStep[];
  emergency?: EmergencyBlock;
  locationIntro?: string;
  stats: Stat[];
  reviews: GeneratedReview[];
  faqs: Faq[];
  relatedServices: LinkAnchor[];
  relatedLocations: LinkAnchor[];
  cta: CtaBlock;
  imagePrompts: ImagePrompt[];
  internalLinks: LinkAnchor[];
}

// --- Provider abstraction ----------------------------------------------------

export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'mock';

export interface AICompletionRequest {
  system?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider to return strict JSON. */
  json?: boolean;
}

export interface AICompletionResult {
  text: string;
  provider: ProviderName;
  model: string;
}

export interface AIProvider {
  readonly name: ProviderName;
  readonly defaultModel: string;
  /** True when the required API key/env is present. */
  isConfigured(): boolean;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
  /** Optional token streaming; falls back to a single chunk when absent. */
  stream?(req: AICompletionRequest): AsyncIterable<string>;
}

export interface AIConfig {
  provider: ProviderName;
  model?: string;
  temperature: number;
  maxTokens: number;
  /** Whether live provider calls should be attempted (key present + not mock). */
  enabled: boolean;
}

/** Metadata returned alongside generated content. */
export interface GenerationMeta {
  provider: ProviderName;
  model: string;
  cached: boolean;
  generatedAt: string;
  promptVersion: string;
  agentId: string;
  /** True when the deterministic fallback produced this (no live AI). */
  fallback: boolean;
}

export interface GenerationResult {
  content: GeneratedPageContent;
  meta: GenerationMeta;
}
