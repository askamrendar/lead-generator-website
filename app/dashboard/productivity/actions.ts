'use server';

import { revalidatePath } from 'next/cache';
import { isAccessError } from '@/lib/auth/access';
import {
  setPinned,
  setFavorite,
  saveRevision,
  restoreRevision,
  importWebsite,
  type WebsiteExport,
} from '@/lib/productivity/service';
import { restoreWebsite, archiveWebsite, restoreFromTrash, purgeWebsite } from '@/lib/websites/service';
import { bulkGenerateWebsites, bulkGenerateContent, bulkDeploy } from '@/lib/productivity/bulk';

/** Phase 9 productivity server actions. All mutations go through tenant-access-guarded services. */
export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to do that.' };
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

function refresh() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/websites');
  revalidatePath('/dashboard/trash');
  revalidatePath('/dashboard/favorites');
}

export async function pinWebsiteAction(websiteId: string, pinned: boolean): Promise<ActionResult> {
  const r = await guard(() => setPinned(websiteId, pinned));
  if (r.ok) refresh();
  return r;
}

export async function favoriteWebsiteAction(websiteId: string, favorite: boolean): Promise<ActionResult> {
  const r = await guard(() => setFavorite(websiteId, favorite));
  if (r.ok) refresh();
  return r;
}

export async function restoreFromTrashAction(websiteId: string): Promise<ActionResult> {
  const r = await guard(() => restoreFromTrash(websiteId));
  if (r.ok) refresh();
  return r;
}

export async function purgeWebsiteAction(websiteId: string): Promise<ActionResult> {
  const r = await guard(() => purgeWebsite(websiteId));
  if (r.ok) refresh();
  return r;
}

export async function archiveWebsiteAction(websiteId: string): Promise<ActionResult> {
  const r = await guard(() => archiveWebsite(websiteId));
  if (r.ok) refresh();
  return r;
}

export async function restoreArchivedAction(websiteId: string): Promise<ActionResult> {
  const r = await guard(() => restoreWebsite(websiteId));
  if (r.ok) refresh();
  return r;
}

export async function saveRevisionAction(websiteId: string, label: string, id: string, at: string): Promise<ActionResult> {
  const r = await guard(() => saveRevision(websiteId, label || 'Manual snapshot', id, at));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}`);
  return r;
}

export async function restoreRevisionAction(websiteId: string, revisionId: string): Promise<ActionResult> {
  const r = await guard(() => restoreRevision(websiteId, revisionId));
  if (r.ok) revalidatePath(`/dashboard/websites/${websiteId}`);
  return r;
}

export async function importWebsiteAction(workspaceId: string, data: WebsiteExport): Promise<ActionResult> {
  const r = await guard(() => importWebsite(workspaceId, data));
  if (r.ok) refresh();
  return r;
}

// ----- Bulk operations (reuse Background Jobs) -----

export async function bulkGenerateWebsitesAction(workspaceId: string, ids: string[]): Promise<ActionResult> {
  const r = await guard(() => bulkGenerateWebsites(workspaceId, ids));
  if (r.ok) revalidatePath('/dashboard/jobs');
  return r;
}

export async function bulkGenerateContentAction(workspaceId: string, ids: string[]): Promise<ActionResult> {
  const r = await guard(() => bulkGenerateContent(workspaceId, ids));
  if (r.ok) revalidatePath('/dashboard/jobs');
  return r;
}

export async function bulkDeployAction(workspaceId: string, ids: string[]): Promise<ActionResult> {
  const r = await guard(() => bulkDeploy(workspaceId, ids));
  if (r.ok) revalidatePath('/dashboard/jobs');
  return r;
}
