import { getAIConfig, getProviderKeyEnv } from '@/lib/ai/config';
import type { ImagePrompt } from '@/lib/ai/types';

/**
 * AI image generation — turns the image-prompt engine's text prompts into real
 * PNG bytes via the configured provider's image API (dependency-free `fetch`,
 * same pattern as the text providers).
 *
 * Provider support:
 *   openai     → Images API (gpt-image-1, b64 response)
 *   gemini     → Imagen 3 via the Generative Language API
 *   openrouter → routes to openai/gpt-image-1 when the account allows it
 *   anthropic  → no image API → not supported (callers skip gracefully)
 *
 * Callers must treat `null` as "no image available" — generation NEVER fails a
 * website build over an image (the block placeholders remain the honest fallback).
 */

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
}

function sizeFor(aspect: string | undefined): string {
  switch (aspect) {
    case '16:9':
    case '1.91:1':
      return '1536x1024';
    case '9:16':
      return '1024x1536';
    default:
      return '1024x1024';
  }
}

/** True when the ACTIVE provider (workspace key or env) can generate images. */
export function isImageGenAvailable(): boolean {
  const cfg = getAIConfig();
  return cfg.enabled && (cfg.provider === 'openai' || cfg.provider === 'gemini');
}

async function openaiImage(prompt: string, aspect?: string): Promise<GeneratedImage | null> {
  const key = getProviderKeyEnv('openai');
  if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: sizeFor(aspect),
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI images ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return null;
  return { bytes: Buffer.from(b64, 'base64'), mimeType: 'image/png' };
}

async function geminiImage(prompt: string, aspect?: string): Promise<GeneratedImage | null> {
  const key = getProviderKeyEnv('gemini');
  if (!key) return null;
  const ratio = aspect === '16:9' || aspect === '1.91:1' ? '16:9' : aspect === '9:16' ? '9:16' : '1:1';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: ratio },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini imagen ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) return null;
  return { bytes: Buffer.from(b64, 'base64'), mimeType: 'image/png' };
}

/**
 * Generate one image for a prompt using the active provider. Returns null when
 * the provider has no image API or is unconfigured. Throws only on real API
 * errors (callers catch and continue — images are always best-effort).
 */
export async function generateImage(p: ImagePrompt): Promise<GeneratedImage | null> {
  const cfg = getAIConfig();
  if (!cfg.enabled) return null;
  switch (cfg.provider) {
    case 'openai':
      return openaiImage(p.prompt, p.aspect);
    case 'gemini':
      return geminiImage(p.prompt, p.aspect);
    default:
      return null; // anthropic/openrouter text-only — skip gracefully
  }
}
