'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { retryJob, cancelJob } from '@/lib/jobs/service';
import { markRead, markAllRead } from '@/lib/jobs/notifications';

/** Worker/queue + notification server actions. Owner-only (session-gated). */
export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Uniform guard: authenticate, run, and return the shared result union — never leak a
 * raw error to the client (matches the pattern used by the other dashboard actions).
 */
async function guard(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await requireUser();
    await fn();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHENTICATED') {
      return { ok: false, error: 'You must be signed in.' };
    }
    return { ok: false, error: 'Action failed. Please try again.' };
  }
}

export async function retryJobAction(id: string): Promise<ActionResult> {
  const r = await guard(() => retryJob(id));
  if (r.ok) revalidatePath('/dashboard/jobs');
  return r;
}

export async function cancelJobAction(id: string): Promise<ActionResult> {
  const r = await guard(() => cancelJob(id));
  if (r.ok) revalidatePath('/dashboard/jobs');
  return r;
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  let userId: string | null = null;
  const r = await guard(async () => {
    const user = await requireUser();
    userId = user.id;
    await markRead(user.id, id);
  });
  if (r.ok && userId) revalidatePath('/dashboard/notifications');
  return r;
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const r = await guard(async () => {
    const user = await requireUser();
    await markAllRead(user.id);
  });
  if (r.ok) revalidatePath('/dashboard/notifications');
  return r;
}
