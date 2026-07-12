import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireWebsiteAccess } from '@/lib/auth/access';
import {
  isValidHostname,
  makeVerificationToken,
  expectedRecords,
} from '@/lib/domains/dns';
import { checkTxtVerification } from '@/lib/domains/verify';
import { getDomainProvider, listDomainProviders } from '@/lib/domains/providers';
import { decryptSecretMap } from '@/lib/security/secrets';
import type { DomainDTO, DomainProviderHealth, DomainProviderId } from '@/lib/domains/types';

/**
 * Domain Manager service — the ONLY read/write path for domains, all tenant-access
 * guarded. Independent of deployment/builder. Provider credentials are read from the
 * website's existing `deploymentConfig.envVars` (BYO keys) — no duplicate store.
 */

type DomainRow = {
  id: string;
  hostname: string;
  isPrimary: boolean;
  provider: string;
  status: string;
  verified: boolean;
  sslStatus: string;
  redirectWww: boolean;
  redirectTo: string | null;
  verificationToken: string;
  createdAt: Date;
  verifiedAt: Date | null;
};

function toDTO(r: DomainRow): DomainDTO {
  return {
    id: r.id,
    hostname: r.hostname,
    isPrimary: r.isPrimary,
    provider: r.provider,
    status: r.status as DomainDTO['status'],
    verified: r.verified,
    sslStatus: r.sslStatus,
    redirectWww: r.redirectWww,
    redirectTo: r.redirectTo,
    createdAt: r.createdAt.toISOString(),
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    records: expectedRecords(r.hostname, r.verificationToken),
  };
}

async function websiteCredentials(websiteId: string): Promise<Record<string, string>> {
  const w = await prisma.website.findUniqueOrThrow({
    where: { id: websiteId },
    select: { deploymentConfig: true },
  });
  const cfg = (w.deploymentConfig as { envVars?: Record<string, string> } | null) ?? {};
  const envVars = decryptSecretMap(cfg.envVars) ?? {};
  // merge process.env for the same keys (org-level fallback)
  const creds: Record<string, string> = { ...envVars };
  for (const p of listDomainProviders())
    for (const k of p.credentialKeys) if (!creds[k] && process.env[k]) creds[k] = process.env[k]!;
  return creds;
}

export async function listDomains(websiteId: string): Promise<DomainDTO[]> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const rows = await prisma.domain.findMany({
    where: { websiteId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(toDTO);
}

export async function addDomain(
  websiteId: string,
  hostname: string,
  provider: DomainProviderId = 'custom',
): Promise<{ ok: boolean; error?: string }> {
  await requireWebsiteAccess(websiteId, 'website:update');
  const host = hostname.trim().toLowerCase();
  if (!isValidHostname(host)) return { ok: false, error: 'Enter a valid domain (e.g. example.com).' };
  const existingCount = await prisma.domain.count({ where: { websiteId } });
  try {
    await prisma.domain.create({
      data: {
        websiteId,
        hostname: host,
        provider,
        verificationToken: makeVerificationToken(),
        isPrimary: existingCount === 0, // first domain is primary
        status: 'PENDING',
      },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'That domain is already connected.' };
    }
    throw err;
  }
}

export async function removeDomain(domainId: string): Promise<void> {
  const d = await prisma.domain.findUniqueOrThrow({ where: { id: domainId }, select: { websiteId: true, hostname: true, provider: true } });
  await requireWebsiteAccess(d.websiteId, 'website:update');
  const provider = getDomainProvider(d.provider);
  if (provider) await provider.remove(d.hostname, await websiteCredentials(d.websiteId)).catch(() => undefined);
  await prisma.domain.delete({ where: { id: domainId } });
}

export async function setPrimaryDomain(domainId: string): Promise<void> {
  const d = await prisma.domain.findUniqueOrThrow({ where: { id: domainId }, select: { websiteId: true } });
  await requireWebsiteAccess(d.websiteId, 'website:update');
  await prisma.$transaction([
    prisma.domain.updateMany({ where: { websiteId: d.websiteId }, data: { isPrimary: false } }),
    prisma.domain.update({ where: { id: domainId }, data: { isPrimary: true } }),
  ]);
}

export async function updateRedirects(
  domainId: string,
  redirects: { redirectWww: boolean; redirectTo: string | null },
): Promise<void> {
  const d = await prisma.domain.findUniqueOrThrow({ where: { id: domainId }, select: { websiteId: true } });
  await requireWebsiteAccess(d.websiteId, 'website:update');
  await prisma.domain.update({ where: { id: domainId }, data: redirects });
}

export async function verifyDomain(domainId: string): Promise<{ verified: boolean; message: string }> {
  const d = await prisma.domain.findUniqueOrThrow({
    where: { id: domainId },
    select: { websiteId: true, hostname: true, verificationToken: true, provider: true },
  });
  await requireWebsiteAccess(d.websiteId, 'website:update');

  const result = await checkTxtVerification(d.hostname, d.verificationToken);
  const creds = await websiteCredentials(d.websiteId);
  const provider = getDomainProvider(d.provider);

  if (result.verified) {
    const ssl = provider ? await provider.ssl(d.hostname, creds) : { status: 'pending' as const };
    if (provider) await provider.attach(d.hostname, creds).catch(() => undefined);
    await prisma.domain.update({
      where: { id: domainId },
      data: { verified: true, status: 'ACTIVE', sslStatus: ssl.status, verifiedAt: new Date() },
    });
  } else {
    await prisma.domain.update({ where: { id: domainId }, data: { status: 'VERIFYING' } });
  }
  return { verified: result.verified, message: result.message };
}

export async function domainProviderHealth(websiteId: string): Promise<DomainProviderHealth[]> {
  await requireWebsiteAccess(websiteId, 'website:view');
  const creds = await websiteCredentials(websiteId);
  return Promise.all(listDomainProviders().map((p) => p.health(creds)));
}
