import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/access';
import { getStorageProvider, listStorageProviders } from '@/lib/media/storage/registry';
import { mimeToKind, isAllowedMime, safeFilename } from '@/lib/media/kind';
import type { StorageHealth } from '@/lib/media/storage/types';

/**
 * Media Library service — the ONLY read/write path for assets/folders. Workspace-
 * scoped (assets are reusable across the workspace's websites); every op routes
 * through `requireWorkspaceAccess`. Independent module — never edits pages/deploys.
 */

export interface MediaAssetDTO {
  id: string;
  kind: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  tags: string[];
  usageCount: number;
  folderId: string | null;
  createdAt: string;
}
export interface FolderDTO {
  id: string;
  name: string;
  count: number;
}

type AssetRow = {
  id: string; kind: string; filename: string; url: string; mimeType: string;
  sizeBytes: number; width: number | null; height: number | null; altText: string | null;
  tags: string[]; usageCount: number; folderId: string | null; createdAt: Date;
};

function toDTO(a: AssetRow): MediaAssetDTO {
  return {
    id: a.id, kind: a.kind, filename: a.filename, url: a.url, mimeType: a.mimeType,
    sizeBytes: a.sizeBytes, width: a.width, height: a.height, altText: a.altText,
    tags: a.tags, usageCount: a.usageCount, folderId: a.folderId, createdAt: a.createdAt.toISOString(),
  };
}

const cloudCreds = (): Record<string, string> => ({ ...process.env } as Record<string, string>);

export async function listAssets(workspaceId: string, folderId?: string | null): Promise<MediaAssetDTO[]> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  const rows = await prisma.mediaAsset.findMany({
    where: { workspaceId, ...(folderId !== undefined ? { folderId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return rows.map(toDTO);
}

export async function listFolders(workspaceId: string): Promise<FolderDTO[]> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  const folders = await prisma.mediaFolder.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { assets: true } } },
  });
  return folders.map((f) => ({ id: f.id, name: f.name, count: f._count.assets }));
}

export async function createFolder(workspaceId: string, name: string): Promise<void> {
  await requireWorkspaceAccess(workspaceId, 'workspace:update');
  await prisma.mediaFolder.create({ data: { workspaceId, name: name.trim().slice(0, 80) || 'Untitled' } });
}

export async function deleteFolder(folderId: string): Promise<void> {
  const f = await prisma.mediaFolder.findUniqueOrThrow({ where: { id: folderId }, select: { workspaceId: true } });
  await requireWorkspaceAccess(f.workspaceId, 'workspace:update');
  await prisma.mediaFolder.delete({ where: { id: folderId } }); // assets' folderId set null (schema)
}

export interface UploadInput {
  filename: string;
  mimeType: string;
  data: Uint8Array;
  folderId?: string | null;
}

export async function uploadAsset(workspaceId: string, input: UploadInput): Promise<MediaAssetDTO> {
  await requireWorkspaceAccess(workspaceId, 'workspace:update');
  return uploadAssetCore(workspaceId, input);
}

/**
 * SYSTEM-level upload (no session) — used by background job handlers (e.g. AI
 * image generation during website.generate). The enqueue site is the
 * authorization point, matching the jobs-run-as-SYSTEM convention.
 */
export async function uploadAssetCore(workspaceId: string, input: UploadInput): Promise<MediaAssetDTO> {
  if (!isAllowedMime(input.mimeType)) throw new Error('Unsupported file type.');

  const provider = getStorageProvider('local'); // functional default; cloud = Phase 10
  const { key } = await provider.put(workspaceId, safeFilename(input.filename), input.data, input.mimeType);

  const asset = await prisma.mediaAsset.create({
    data: {
      workspaceId,
      folderId: input.folderId ?? null,
      kind: mimeToKind(input.mimeType) as never,
      filename: safeFilename(input.filename),
      url: '', // set below once we have the id
      storageProvider: provider.id,
      storageKey: key,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
    },
  });
  const url = provider.servedUrl(asset.id);
  const updated = await prisma.mediaAsset.update({ where: { id: asset.id }, data: { url } });
  return toDTO(updated);
}

export async function updateAsset(
  assetId: string,
  patch: { altText?: string; tags?: string[]; folderId?: string | null },
): Promise<void> {
  const a = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: assetId }, select: { workspaceId: true } });
  await requireWorkspaceAccess(a.workspaceId, 'workspace:update');
  await prisma.mediaAsset.update({ where: { id: assetId }, data: patch });
}

export async function deleteAsset(assetId: string): Promise<void> {
  const a = await prisma.mediaAsset.findUniqueOrThrow({
    where: { id: assetId },
    select: { workspaceId: true, storageProvider: true, storageKey: true },
  });
  await requireWorkspaceAccess(a.workspaceId, 'workspace:update');
  await getStorageProvider(a.storageProvider).delete(a.storageKey);
  await prisma.mediaAsset.delete({ where: { id: assetId } });
}

/** For the serve route: access-checked asset bytes (local) or metadata. */
export async function readAssetBytes(assetId: string): Promise<{ data: Uint8Array; mimeType: string } | null> {
  // Missing/unknown id → null (the route maps that to 404) rather than a Prisma P2025
  // throw that would surface as a noisy 500. Access is still enforced below for real assets.
  const a = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { workspaceId: true, storageProvider: true, storageKey: true, mimeType: true },
  });
  if (!a) return null;
  await requireWorkspaceAccess(a.workspaceId, 'workspace:view');
  const stored = await getStorageProvider(a.storageProvider).read(a.storageKey);
  return stored ? { data: stored.data, mimeType: a.mimeType } : null;
}

/**
 * SYSTEM-level asset read (no session) — for surfaces that enforce their OWN
 * gate (the public tenant-site asset route checks published-status + workspace
 * ownership before calling this). Returns workspaceId so callers can verify.
 */
export async function readAssetBytesCore(
  assetId: string,
): Promise<{ data: Uint8Array; mimeType: string; workspaceId: string } | null> {
  const a = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { workspaceId: true, storageProvider: true, storageKey: true, mimeType: true },
  });
  if (!a) return null;
  const stored = await getStorageProvider(a.storageProvider).read(a.storageKey);
  return stored ? { data: stored.data, mimeType: a.mimeType, workspaceId: a.workspaceId } : null;
}

export async function storageHealth(workspaceId: string): Promise<StorageHealth[]> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  return Promise.all(listStorageProviders().map((p) => p.health(cloudCreds())));
}
