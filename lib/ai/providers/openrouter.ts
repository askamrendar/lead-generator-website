import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from '@/lib/ai/types';
import { getProviderKeyEnv } from '@/lib/ai/config';
import { parseOpenAISSE } from '@/lib/ai/providers/types';
import { resolveSiteUrl } from '@/lib/site';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** OpenRouter provider — OpenAI-compatible gateway to many models. */
export const openrouterProvider: AIProvider = {
  name: 'openrouter',
  defaultModel: 'openai/gpt-4o-mini',

  isConfigured() {
    return Boolean(getProviderKeyEnv('openrouter'));
  },

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const key = getProviderKeyEnv('openrouter');
    if (!key) throw new Error('OPENROUTER_API_KEY missing');
    const model = req.model ?? this.defaultModel;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': resolveSiteUrl(),
        'X-Title': 'Lead Generator Website',
      },
      body: JSON.stringify({
        model,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 2000,
        ...(req.json ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          ...(req.system ? [{ role: 'system', content: req.system }] : []),
          { role: 'user', content: req.prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      provider: 'openrouter',
      model,
    };
  },

  async *stream(req: AICompletionRequest): AsyncIterable<string> {
    const key = getProviderKeyEnv('openrouter');
    if (!key) throw new Error('OPENROUTER_API_KEY missing');
    const model = req.model ?? this.defaultModel;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 2000,
        messages: [
          ...(req.system ? [{ role: 'system', content: req.system }] : []),
          { role: 'user', content: req.prompt },
        ],
      }),
    });
    if (!res.ok || !res.body) throw new Error(`OpenRouter stream ${res.status}`);
    yield* parseOpenAISSE(res.body);
  },
};
