import type { DnsRecord } from '@/lib/domains/dns';

/** Domain Manager types. Independent module — never references deployment/builder. */

export type DomainProviderId = 'cloudflare' | 'vercel' | 'netlify' | 'custom';
export type DomainStatus = 'PENDING' | 'VERIFYING' | 'ACTIVE' | 'ERROR';
export type SslStatus = 'none' | 'pending' | 'active';
export type Credentials = Record<string, string | undefined>;

export interface DomainDTO {
  id: string;
  hostname: string;
  isPrimary: boolean;
  provider: string;
  status: DomainStatus;
  verified: boolean;
  sslStatus: string;
  redirectWww: boolean;
  redirectTo: string | null;
  createdAt: string;
  verifiedAt: string | null;
  /** Records the user should add (derived; not stored). */
  records: DnsRecord[];
}

export interface DomainProviderHealth {
  id: DomainProviderId;
  name: string;
  configured: boolean;
  ok: boolean;
  message: string;
}

/** Provider contract for attaching a verified domain to a host + managing its SSL. */
export interface DomainProvider {
  id: DomainProviderId;
  name: string;
  credentialKeys: string[];
  authenticate(creds: Credentials): Promise<{ ok: boolean; message: string }>;
  attach(hostname: string, creds: Credentials): Promise<{ ok: boolean; message: string }>;
  ssl(hostname: string, creds: Credentials): Promise<{ status: SslStatus; message: string }>;
  remove(hostname: string, creds: Credentials): Promise<{ ok: boolean; message: string }>;
  health(creds: Credentials): Promise<DomainProviderHealth>;
}
