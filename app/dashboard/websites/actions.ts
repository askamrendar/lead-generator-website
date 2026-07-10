'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { websiteWizardSchema, renameWebsiteSchema } from '@/lib/websites/schema';
import {
  createWebsite,
  renameWebsite,
  duplicateWebsite,
  archiveWebsite,
  restoreWebsite,
  deleteWebsite,
} from '@/lib/websites/service';
import { isAccessError } from '@/lib/auth/access';

/**
 * Server actions for the Website Manager. All mutations go through the service (which
 * enforces tenant-access + RBAC). Access failures are swallowed into a generic result
 * (never leaking existence); the UI shows a toast. Actions revalidate the affected
 * routes; create/delete redirect.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to do that.' };
    throw err;
  }
}

export async function createWebsiteAction(
  workspaceId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = websiteWizardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please review the form and try again.' };

  let newId: string;
  try {
    const { id } = await createWebsite(workspaceId, parsed.data);
    newId = id;
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to create websites here.' };
    throw err;
  }
  revalidatePath('/dashboard/websites');
  redirect(`/dashboard/websites/${newId}`);
}

export async function renameWebsiteAction(
  websiteId: string,
  name: unknown,
): Promise<ActionResult> {
  const parsed = renameWebsiteSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: 'Enter a valid name.' };
  const result = await guard(() => renameWebsite(websiteId, parsed.data.name));
  if (result.ok) {
    revalidatePath('/dashboard/websites');
    revalidatePath(`/dashboard/websites/${websiteId}`);
  }
  return result;
}

export async function duplicateWebsiteAction(websiteId: string): Promise<ActionResult> {
  let result: ActionResult;
  try {
    await duplicateWebsite(websiteId);
    result = { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to duplicate that.' };
    throw err;
  }
  revalidatePath('/dashboard/websites');
  return result;
}

export async function archiveWebsiteAction(websiteId: string): Promise<ActionResult> {
  const result = await guard(() => archiveWebsite(websiteId));
  if (result.ok) revalidatePath('/dashboard/websites');
  return result;
}

export async function restoreWebsiteAction(websiteId: string): Promise<ActionResult> {
  const result = await guard(() => restoreWebsite(websiteId));
  if (result.ok) revalidatePath('/dashboard/websites');
  return result;
}

export async function deleteWebsiteAction(websiteId: string): Promise<ActionResult> {
  const result = await guard(() => deleteWebsite(websiteId));
  if (result.ok) revalidatePath('/dashboard/websites');
  return result;
}
