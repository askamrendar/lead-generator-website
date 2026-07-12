import type { StorageProvider, StorageProviderId } from '@/lib/media/storage/types';
import { LocalStorage } from '@/lib/media/storage/local';
import {
  R2Storage,
  S3Storage,
  GcsStorage,
  AzureStorage,
  SupabaseStorage,
  CustomStorage,
} from '@/lib/media/storage/cloud';

/** Storage provider registry — add a provider here and the library picks it up. */
const PROVIDERS: Record<StorageProviderId, StorageProvider> = {
  local: new LocalStorage(),
  r2: new R2Storage(),
  s3: new S3Storage(),
  gcs: new GcsStorage(),
  azure: new AzureStorage(),
  supabase: new SupabaseStorage(),
  custom: new CustomStorage(),
};

export function getStorageProvider(id: string): StorageProvider {
  return PROVIDERS[id as StorageProviderId] ?? PROVIDERS.local;
}

export function listStorageProviders(): StorageProvider[] {
  return Object.values(PROVIDERS);
}
