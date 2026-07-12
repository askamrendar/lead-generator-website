import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/session';

/**
 * Workspace / theme preferences (Phase 9). User-scoped, single row per user. `data`
 * is open JSON for forward-compat (keyboard shortcuts, default range, layout density).
 */

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Preferences {
  theme: ThemePreference;
  data: Record<string, unknown>;
}

const DEFAULTS: Preferences = { theme: 'system', data: {} };

export async function getPreferences(): Promise<Preferences> {
  const user = await requireUser();
  const row = await prisma.userPreference.findUnique({ where: { userId: user.id } });
  if (!row) return DEFAULTS;
  return {
    theme: (row.theme as ThemePreference) ?? 'system',
    data: (row.data as Record<string, unknown> | null) ?? {},
  };
}

export async function setTheme(theme: ThemePreference): Promise<void> {
  const user = await requireUser();
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, theme },
    update: { theme },
  });
}

/** Merge a patch into the open `data` blob (shallow). */
export async function updatePreferenceData(patch: Record<string, unknown>): Promise<void> {
  const user = await requireUser();
  const current = await getPreferences();
  const merged = { ...current.data, ...patch };
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, data: merged as object },
    update: { data: merged as object },
  });
}
