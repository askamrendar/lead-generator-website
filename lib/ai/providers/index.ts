import type { AIProvider, ProviderName } from '@/lib/ai/types';
import { getAIConfig } from '@/lib/ai/config';
import { openaiProvider } from '@/lib/ai/providers/openai';
import { anthropicProvider } from '@/lib/ai/providers/anthropic';
import { geminiProvider } from '@/lib/ai/providers/gemini';
import { openrouterProvider } from '@/lib/ai/providers/openrouter';
import { mockProvider } from '@/lib/ai/providers/mock';

const REGISTRY: Record<ProviderName, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  mock: mockProvider,
};

/** Look up a provider by name. */
export function getProviderByName(name: ProviderName): AIProvider {
  return REGISTRY[name] ?? mockProvider;
}

/** The active provider, resolved from configuration (env). */
export function getProvider(): AIProvider {
  return getProviderByName(getAIConfig().provider);
}

export {
  openaiProvider,
  anthropicProvider,
  geminiProvider,
  openrouterProvider,
  mockProvider,
};
