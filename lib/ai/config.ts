import type { AIConfig, ProviderName } from '@/lib/ai/types';

/**
 * AI configuration, resolved from environment variables. Nothing is hardcoded:
 * the active provider is chosen by `AI_PROVIDER`, and the engine falls back to
 * the deterministic `mock` provider whenever the selected provider has no key.
 *
 *   AI_PROVIDER=openai|anthropic|gemini|openrouter|mock   (default: mock)
 *   AI_MODEL=<model id>                                    (provider default)
 *   AI_TEMPERATURE=0.7
 *   AI_MAX_TOKENS=2000
 *   OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY
 */

const VALID_PROVIDERS: ProviderName[] = [
  'openai',
  'anthropic',
  'gemini',
  'openrouter',
  'mock',
];

export function getProviderKeyEnv(provider: ProviderName): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'gemini':
      return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'mock':
      return 'mock'; // always "configured"
  }
}

export function getAIConfig(): AIConfig {
  const requested = (process.env.AI_PROVIDER ?? 'mock').toLowerCase();
  const provider: ProviderName = VALID_PROVIDERS.includes(
    requested as ProviderName,
  )
    ? (requested as ProviderName)
    : 'mock';

  const hasKey = Boolean(getProviderKeyEnv(provider));
  const effective: ProviderName = hasKey ? provider : 'mock';

  const temperature = Number(process.env.AI_TEMPERATURE ?? '0.7');
  const maxTokens = Number(process.env.AI_MAX_TOKENS ?? '2000');

  return {
    provider: effective,
    model: process.env.AI_MODEL,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 2000,
    enabled: effective !== 'mock',
  };
}

/** True when a real provider is configured and should be called. */
export function isAIEnabled(): boolean {
  return getAIConfig().enabled;
}
