/**
 * StorageProvider abstraction (Phase 8.2). The Media Library persists bytes through a
 * pluggable provider — Local works today; cloud providers (R2/S3/GCS/Azure/Supabase/
 * Custom) are credential-gated and report "awaiting credentials" until Phase 10 keys.
 * The service talks only to this interface; no host is hard-coded.
 */
export type StorageProviderId = 'local' | 'r2' | 's3' | 'gcs' | 'azure' | 'supabase' | 'custom';

export type Credentials = Record<string, string | undefined>;

export interface StorageHealth {
  id: StorageProviderId;
  name: string;
  configured: boolean;
  ok: boolean;
  message: string;
}

export interface StorageProvider {
  id: StorageProviderId;
  name: string;
  credentialKeys: string[];
  /** True when the provider can accept uploads (Local: always; cloud: creds present). */
  isReady(creds: Credentials): boolean;
  /** Persist bytes; returns an opaque storage key. */
  put(workspaceId: string, filename: string, data: Uint8Array, contentType: string): Promise<{ key: string }>;
  /** Read bytes back (Local serve route). Cloud returns null (served via CDN). */
  read(key: string): Promise<{ data: Uint8Array; contentType?: string } | null>;
  delete(key: string): Promise<void>;
  /** The URL the app serves this asset from (local serve route id-based). */
  servedUrl(assetId: string): string;
  health(creds: Credentials): Promise<StorageHealth>;
}
