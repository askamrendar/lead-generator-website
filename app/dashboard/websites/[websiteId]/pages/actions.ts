'use server';

import { revalidatePath } from 'next/cache';
import {
  generateOne,
  generateBulk,
  updateContent,
  setStatus,
  duplicateContent,
  deleteContent,
} from '@/lib/blog/service';
import { isAccessError } from '@/lib/auth/access';
import type { ContentType } from '@/lib/blog/content-types';

/** Content/Blog server actions (tenant-access enforced in the service). */
export type ContentResult = { ok: true } | { ok: false; error: string };

function rev(websiteId: string) {
  revalidatePath(`/dashboard/websites/${websiteId}/pages`);
}
async function guard(websiteId: string, fn: () => Promise<unknown>): Promise<ContentResult> {
  try {
    await fn();
    rev(websiteId);
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to manage content.' };
    throw err;
  }
}

export async function generateOneAction(websiteId: string, type: ContentType, topic?: string): Promise<ContentResult> {
  return guard(websiteId, () => generateOne(websiteId, type, topic || undefined));
}
export async function generateBulkAction(websiteId: string, types: ContentType[]): Promise<ContentResult> {
  return guard(websiteId, () => generateBulk(websiteId, types));
}
export async function updateContentAction(
  websiteId: string,
  contentId: string,
  patch: { title?: string; body?: string; excerpt?: string; tags?: string[]; featuredImageId?: string | null },
): Promise<ContentResult> {
  return guard(websiteId, () => updateContent(contentId, patch));
}
export async function setStatusAction(
  websiteId: string,
  contentId: string,
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED',
  scheduledAtIso?: string,
): Promise<ContentResult> {
  return guard(websiteId, () => setStatus(contentId, status, scheduledAtIso ? new Date(scheduledAtIso) : null));
}
export async function duplicateContentAction(websiteId: string, contentId: string): Promise<ContentResult> {
  return guard(websiteId, () => duplicateContent(contentId));
}
export async function deleteContentAction(websiteId: string, contentId: string): Promise<ContentResult> {
  return guard(websiteId, () => deleteContent(contentId));
}
