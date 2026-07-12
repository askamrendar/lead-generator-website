'use server';

import { revalidatePath } from 'next/cache';
import {
  addDomain,
  removeDomain,
  setPrimaryDomain,
  updateRedirects,
  verifyDomain,
} from '@/lib/domains/service';
import { isAccessError } from '@/lib/auth/access';
import type { DomainProviderId } from '@/lib/domains/types';

/** Domain Manager server actions (tenant-access enforced in the service). */
export type DomainResult = { ok: true; message?: string } | { ok: false; error: string };

function rev(websiteId: string) {
  revalidatePath(`/dashboard/websites/${websiteId}/domains`);
}
function toError(err: unknown): DomainResult | never {
  if (isAccessError(err)) return { ok: false, error: 'You do not have access to manage domains.' };
  throw err;
}

export async function addDomainAction(
  websiteId: string,
  hostname: string,
  provider: DomainProviderId,
): Promise<DomainResult> {
  try {
    const r = await addDomain(websiteId, hostname, provider);
    if (r.ok) rev(websiteId);
    return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'Could not add domain.' };
  } catch (err) {
    return toError(err);
  }
}

export async function verifyDomainAction(websiteId: string, domainId: string): Promise<DomainResult> {
  try {
    const r = await verifyDomain(domainId);
    rev(websiteId);
    return { ok: true, message: r.message };
  } catch (err) {
    return toError(err);
  }
}

export async function setPrimaryAction(websiteId: string, domainId: string): Promise<DomainResult> {
  try {
    await setPrimaryDomain(domainId);
    rev(websiteId);
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}

export async function removeDomainAction(websiteId: string, domainId: string): Promise<DomainResult> {
  try {
    await removeDomain(domainId);
    rev(websiteId);
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}

export async function updateRedirectsAction(
  websiteId: string,
  domainId: string,
  redirects: { redirectWww: boolean; redirectTo: string | null },
): Promise<DomainResult> {
  try {
    await updateRedirects(domainId, redirects);
    rev(websiteId);
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}
