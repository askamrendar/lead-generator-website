import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from '@/lib/ai/types';
import { getProviderKeyEnv } from '@/lib/ai/config';
import { parseOpenAISSE } from '@/lib/ai/providers/types';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/** OpenAI Chat Completions provider (dependency-free, via fetch). */
export const openaiProvider: AIProvider = {
  name: 'openai',
  defaultModel: 'gpt-4o-mini',

  isConfigured() {
    return Boolean(getProviderKeyEnv('openai'));
  },

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const key = getProviderKeyEnv('openai');
    if (!key) throw new Error('OPENAI_API_KEY missing');
    const model = req.model ?? this.defaultModel;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
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
      throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      provider: 'openai',
      model,
    };
  },

  async *stream(req: AICompletionRequest): AsyncIterable<string> {
    const key = getProviderKeyEnv('openai');
    if (!key) throw new Error('OPENAI_API_KEY missing');
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
    if (!res.ok || !res.body) {
      throw new Error(`OpenAI stream ${res.status}`);
    }
    yield* parseOpenAISSE(res.body);
  },
};
