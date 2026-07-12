'use server';

import { revalidatePath } from 'next/cache';
import {
  saveBuilderDocument,
  publishBuilderDocument,
} from '@/lib/websites/builder-service';
import { isAccessError } from '@/lib/auth/access';
import type { BuilderDocument } from '@/lib/builder/editor/types';

/**
 * Builder server actions. Thin wrappers over the builder service (which enforces
 * tenant-access + RBAC). Autosave calls `saveDraftAction`; the Publish button calls
 * `publishAction`. Access failures return a generic result; the editor toasts it.
 */
export type BuilderActionResult =
  | { ok: true; document?: BuilderDocument }
  | { ok: false; error: string };

export async function saveDraftAction(
  websiteId: string,
  document: BuilderDocument,
): Promise<BuilderActionResult> {
  try {
    await saveBuilderDocument(websiteId, document);
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to edit this website.' };
    throw err;
  }
}

export async function publishAction(
  websiteId: string,
  document: BuilderDocument,
  nowIso: string,
  revisionId: string,
): Promise<BuilderActionResult> {
  try {
    const published = await publishBuilderDocument(websiteId, document, nowIso, revisionId);
    revalidatePath(`/dashboard/websites/${websiteId}`);
    return { ok: true, document: published };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have permission to publish.' };
    throw err;
  }
}
