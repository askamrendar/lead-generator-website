import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from '@/lib/ai/types';

/**
 * Mock provider — always "configured", never calls the network. Returns an
 * empty JSON object for JSON requests (so the content service merges in the
 * deterministic fallback content) and an echo for plain text. This is what
 * keeps the whole engine runnable offline with zero API keys.
 */
export const mockProvider: AIProvider = {
  name: 'mock',
  defaultModel: 'deterministic',

  isConfigured() {
    return true;
  },

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    return {
      text: req.json ? '{}' : `# ${req.prompt.slice(0, 80)}`,
      provider: 'mock',
      model: 'deterministic',
    };
  },

  async *stream(req: AICompletionRequest): AsyncIterable<string> {
    yield req.json ? '{}' : `# ${req.prompt.slice(0, 80)}`;
  },
};
