import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { safeFilename } from '@/lib/media/kind';
import type { StorageProvider, Credentials, StorageHealth } from '@/lib/media/storage/types';

/**
 * Local filesystem storage — the default, credential-free provider. Writes to
 * `.media-store/` (git-ignored) and serves bytes through `/api/media/[assetId]/raw`.
 * Fully functional in dev/single-instance; multi-instance/serverless should use a
 * cloud provider (Phase 10 credentials).
 */
const ROOT = join(process.cwd(), '.media-store');

export class LocalStorage implements StorageProvider {
  id = 'local' as const;
  name = 'Local Storage';
  credentialKeys: string[] = [];

  isReady(): boolean {
    return true;
  }

  async put(workspaceId: string, filename: string, data: Uint8Array): Promise<{ key: string }> {
    const key = `${workspaceId}/${randomUUID()}-${safeFilename(filename)}`;
    const path = join(ROOT, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return { key };
  }

  async read(key: string): Promise<{ data: Uint8Array } | null> {
    try {
      const data = await readFile(join(ROOT, key));
      return { data };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(join(ROOT, key)).catch(() => undefined);
  }

  servedUrl(assetId: string): string {
    return `/api/media/${assetId}/raw`;
  }

  async health(_creds: Credentials): Promise<StorageHealth> {
    return { id: this.id, name: this.name, configured: true, ok: true, message: 'Always available (no credentials).' };
  }
}
