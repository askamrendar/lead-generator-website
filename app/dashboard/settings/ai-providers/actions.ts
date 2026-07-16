'use server';

import { revalidatePath } from 'next/cache';
import {
  saveAiCredentials,
  clearAiCredentials,
  testAiCredentials,
} from '@/lib/ai/credentials';
import { isAccessError } from '@/lib/auth/access';
import type { ProviderName } from '@/lib/ai/types';

/**
 * Server actions for Settings → AI Providers. Access failures collapse into a
 * generic message (tenant-hidden, matching the websites actions convention);
 * validation errors surface their real message.
 */

type ActionResult = { ok: true } | { ok: false; error: string };

function toError(err: unknown): ActionResult {
  if (isAccessError(err)) return { ok: false, error: 'You do not have access to do that.' };
  return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
}

export async function saveAiCredentialsAction(
  workspaceId: string,
  input: { provider: string; apiKey: string; model?: string },
): Promise<ActionResult> {
  try {
    await saveAiCredentials(workspaceId, {
      provider: input.provider as ProviderName,
      apiKey: input.apiKey,
      model: input.model,
    });
    revalidatePath('/dashboard/settings/ai-providers');
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}

export async function clearAiCredentialsAction(workspaceId: string): Promise<ActionResult> {
  try {
    await clearAiCredentials(workspaceId);
    revalidatePath('/dashboard/settings/ai-providers');
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}

export async function testAiCredentialsAction(
  workspaceId: string,
  input: { provider: string; apiKey: string; model?: string },
): Promise<{ ok: boolean; message: string }> {
  try {
    return await testAiCredentials(workspaceId, {
      provider: input.provider as ProviderName,
      apiKey: input.apiKey,
      model: input.model,
    });
  } catch (err) {
    const e = toError(err);
    return { ok: false, message: e.ok ? 'Unexpected.' : e.error };
  }
}
