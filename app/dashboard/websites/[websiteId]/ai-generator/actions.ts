'use server';

import { revalidatePath } from 'next/cache';
import { requireWebsiteAccess, isAccessError } from '@/lib/auth/access';
import { enqueue } from '@/lib/jobs/service';
import { recordAiRun } from '@/lib/prompts/service';

/**
 * AI Generator server actions (Task 1). Generation runs ASYNCHRONOUSLY through the
 * Phase 8.5 background queue (`website.generate` job) — no synchronous long task in the
 * request. Authorization happens here at the enqueue site; the job runs as the system.
 */
export type ActionResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

export async function startGenerationAction(websiteId: string): Promise<ActionResult> {
  try {
    // Verify the caller may update this website before enqueuing work for it.
    const ctx = await requireWebsiteAccess(websiteId, 'website:update');

    const job = await enqueue({
      queue: 'ai',
      type: 'website.generate',
      workspaceId: ctx.workspace?.id,
      payload: { websiteId },
    });

    // Best-effort AI history entry (non-critical).
    try {
      await recordAiRun({ kind: 'website', prompt: 'Generate website from business configuration', websiteId });
    } catch {
      /* history is non-critical */
    }

    revalidatePath(`/dashboard/websites/${websiteId}/ai-generator`);
    revalidatePath('/dashboard/jobs');
    return { ok: true, jobId: job.id };
  } catch (err) {
    if (isAccessError(err)) return { ok: false, error: 'You do not have access to generate this website.' };
    return { ok: false, error: err instanceof Error ? err.message : 'Could not start generation.' };
  }
}
