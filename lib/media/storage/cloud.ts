import type {
  StorageProvider,
  StorageProviderId,
  Credentials,
  StorageHealth,
} from '@/lib/media/storage/types';

/**
 * Credential-gated cloud storage providers. Each declares its credential keys and
 * inherits honest "awaiting credentials" behavior until a real SDK + keys are wired
 * (Phase 10). No duplicated boilerplate — one base, thin subclasses.
 */
function ready(keys: string[], creds: Credentials): boolean {
  return keys.length > 0 && keys.every((k) => Boolean(creds[k]));
}

class CloudStorage implements StorageProvider {
  constructor(
    public id: StorageProviderId,
    public name: string,
    public credentialKeys: string[],
  ) {}

  isReady(creds: Credentials): boolean {
    return ready(this.credentialKeys, creds);
  }

  async put(): Promise<{ key: string }> {
    throw new Error(`${this.name} storage not configured — add credentials in Settings (Phase 10).`);
  }

  async read(): Promise<null> {
    return null; // cloud objects are served from their CDN URL, not proxied
  }

  async delete(): Promise<void> {
    /* no-op until integrated */
  }

  servedUrl(assetId: string): string {
    return `/api/media/${assetId}/raw`;
  }

  async health(creds: Credentials): Promise<StorageHealth> {
    const configured = this.isReady(creds);
    return {
      id: this.id,
      name: this.name,
      configured,
      ok: configured,
      message: configured ? 'Credentials present (SDK integration pending).' : `Add ${this.credentialKeys.join(', ')}.`,
    };
  }
}

export class R2Storage extends CloudStorage {
  constructor() { super('r2', 'Cloudflare R2', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']); }
}
export class S3Storage extends CloudStorage {
  constructor() { super('s3', 'AWS S3', ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']); }
}
export class GcsStorage extends CloudStorage {
  constructor() { super('gcs', 'Google Cloud Storage', ['GCS_PROJECT_ID', 'GCS_BUCKET', 'GCS_KEY_JSON']); }
}
export class AzureStorage extends CloudStorage {
  constructor() { super('azure', 'Azure Blob Storage', ['AZURE_STORAGE_CONNECTION_STRING', 'AZURE_CONTAINER']); }
}
export class SupabaseStorage extends CloudStorage {
  constructor() { super('supabase', 'Supabase Storage', ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_BUCKET']); }
}
export class CustomStorage extends CloudStorage {
  constructor() { super('custom', 'Custom Storage', ['STORAGE_ENDPOINT', 'STORAGE_TOKEN']); }
}
