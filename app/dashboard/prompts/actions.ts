'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { createPrompt, updatePrompt, deletePrompt, markPromptUsed } from '@/lib/prompts/service';

/** AI Prompt Library server actions. User-scoped (services resolve the current user). */
export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await requireUser();
    await fn();
    revalidatePath('/dashboard/prompts');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

export async function createPromptAction(input: { title: string; body: string; category?: string }): Promise<ActionResult> {
  if (!input.title?.trim() || !input.body?.trim()) return { ok: false, error: 'Title and body are required.' };
  return guard(() => createPrompt(input));
}

export async function updatePromptAction(
  id: string,
  patch: { title?: string; body?: string; category?: string; favorite?: boolean },
): Promise<ActionResult> {
  return guard(() => updatePrompt(id, patch));
}

export async function deletePromptAction(id: string): Promise<ActionResult> {
  return guard(() => deletePrompt(id));
}

export async function markPromptUsedAction(id: string): Promise<ActionResult> {
  return guard(() => markPromptUsed(id));
}
