import { NextResponse } from 'next/server';
import { getAIConfig, getProviderKeyEnv } from '@/lib/ai/config';
import { getProviderByName } from '@/lib/ai/providers';
import type { ProviderName } from '@/lib/ai/types';
import { enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

const ALL: ProviderName[] = ['openai', 'anthropic', 'gemini', 'openrouter', 'mock'];

/** Provider status: which is active and which have keys configured. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'ai-read', LIMITS.aiRead());
  if (limited) return limited;

  const config = getAIConfig();
  const providers = ALL.map((name) => {
    const p = getProviderByName(name);
    return {
      name,
      defaultModel: p.defaultModel,
      configured: Boolean(getProviderKeyEnv(name)),
      active: name === config.provider,
    };
  });

  return NextResponse.json({
    active: config.provider,
    enabled: config.enabled,
    providers,
  });
}
