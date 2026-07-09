import type { PageContext } from '@/lib/ai/types';

export interface PromptMessages {
  system: string;
  prompt: string;
}

/** A versioned, reusable prompt template. Prompts live here, never in pages. */
export interface PromptTemplate {
  id: string;
  version: string;
  build(ctx: PageContext): PromptMessages;
}
