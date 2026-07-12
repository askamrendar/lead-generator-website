'use server';

import { revalidatePath } from 'next/cache';
import { setTheme, updatePreferenceData, type ThemePreference } from '@/lib/preferences/service';

/** Workspace / theme preference server actions. User-scoped. */
export type ActionResult = { ok: true } | { ok: false; error: string };

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

export async function setThemeAction(theme: string): Promise<ActionResult> {
  if (!THEMES.includes(theme as ThemePreference)) return { ok: false, error: 'Invalid theme.' };
  try {
    await setTheme(theme as ThemePreference);
    revalidatePath('/dashboard/preferences');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

export async function updatePreferenceDataAction(patch: Record<string, unknown>): Promise<ActionResult> {
  try {
    await updatePreferenceData(patch);
    revalidatePath('/dashboard/preferences');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}
