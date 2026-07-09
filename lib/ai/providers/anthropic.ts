import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from '@/lib/ai/types';
import { getProviderKeyEnv } from '@/lib/ai/config';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

/** Anthropic Messages API provider (via fetch). */
export const anthropicProvider: AIProvider = {
  name: 'anthropic',
  defaultModel: 'claude-sonnet-5',

  isConfigured() {
    return Boolean(getProviderKeyEnv('anthropic'));
  },

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const key = getProviderKeyEnv('anthropic');
    if (!key) throw new Error('ANTHROPIC_API_KEY missing');
    const model = req.model ?? this.defaultModel;

    // Anthropic has no JSON mode flag; we steer via the system prompt instead.
    const system = req.json
      ? `${req.system ?? ''}\n\nRespond with a single valid JSON object and nothing else.`.trim()
      : req.system;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 2000,
        temperature: req.temperature ?? 0.7,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: req.prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const text = Array.isArray(data.content)
      ? data.content
          .map((block: { type: string; text?: string }) =>
            block.type === 'text' ? (block.text ?? '') : '',
          )
          .join('')
      : '';
    return { text, provider: 'anthropic', model };
  },
};
