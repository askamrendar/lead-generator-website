'use server';

import { revalidatePath } from 'next/cache';
import { savePageOverride } from '@/lib/websites/editor-service';
import { isAccessError } from '@/lib/auth/access';

export type EditorActionResult = { ok: true } | { ok: false; error: string };

/** Save one page's content override from the Site Editor. */
export async function savePageOverrideAction(
  websiteId: string,
  path: string,
  patch: unknown,
): Promise<EditorActionResult> {
  try {
    await savePageOverride(websiteId, path, patch);
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to do that.' };
    return { ok: false, error: 'Could not save — please review the fields and try again.' };
  }
  revalidatePath(`/editor/${websiteId}`);
  return { ok: true };
}
