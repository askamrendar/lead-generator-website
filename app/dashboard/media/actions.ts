'use server';

import { revalidatePath } from 'next/cache';
import {
  updateAsset,
  deleteAsset,
  createFolder,
  deleteFolder,
} from '@/lib/media/service';
import { isAccessError } from '@/lib/auth/access';

/** Media Library server actions (tenant-access enforced in the service). Upload uses the route handler. */
export type MediaResult = { ok: true } | { ok: false; error: string };

async function guard(fn: () => Promise<unknown>): Promise<MediaResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to manage media.' };
    throw err;
  }
}

export async function updateAssetAction(
  assetId: string,
  patch: { altText?: string; tags?: string[]; folderId?: string | null },
): Promise<MediaResult> {
  const r = await guard(() => updateAsset(assetId, patch));
  if (r.ok) revalidatePath('/dashboard/media');
  return r;
}

export async function deleteAssetAction(assetId: string): Promise<MediaResult> {
  const r = await guard(() => deleteAsset(assetId));
  if (r.ok) revalidatePath('/dashboard/media');
  return r;
}

export async function createFolderAction(workspaceId: string, name: string): Promise<MediaResult> {
  const r = await guard(() => createFolder(workspaceId, name));
  if (r.ok) revalidatePath('/dashboard/media');
  return r;
}

export async function deleteFolderAction(folderId: string): Promise<MediaResult> {
  const r = await guard(() => deleteFolder(folderId));
  if (r.ok) revalidatePath('/dashboard/media');
  return r;
}
