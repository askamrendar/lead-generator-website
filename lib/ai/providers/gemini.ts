import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from '@/lib/ai/types';
import { getProviderKeyEnv } from '@/lib/ai/config';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Google Gemini provider (generateContent, via fetch). */
export const geminiProvider: AIProvider = {
  name: 'gemini',
  defaultModel: 'gemini-1.5-flash',

  isConfigured() {
    return Boolean(getProviderKeyEnv('gemini'));
  },

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const key = getProviderKeyEnv('gemini');
    if (!key) throw new Error('GEMINI_API_KEY missing');
    const model = req.model ?? this.defaultModel;

    const res = await fetch(
      `${BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(req.system
            ? { systemInstruction: { parts: [{ text: req.system }] } }
            : {}),
          contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.maxTokens ?? 2000,
            ...(req.json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('') ?? '';
    return { text, provider: 'gemini', model };
  },
};
