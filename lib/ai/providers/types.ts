export type {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
  ProviderName,
} from '@/lib/ai/types';

/**
 * Parse Server-Sent-Events text stream from OpenAI-compatible chat APIs
 * (OpenAI, OpenRouter), yielding content deltas. Shared by those providers.
 */
export async function* parseOpenAISSE(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') yield delta;
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
}
