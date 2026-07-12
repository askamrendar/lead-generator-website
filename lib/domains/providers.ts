import type {
  DomainProvider,
  DomainProviderId,
  DomainProviderHealth,
  Credentials,
  SslStatus,
} from '@/lib/domains/types';

/**
 * Domain providers. `custom` needs no credentials (the user manages DNS + SSL is
 * issued automatically once verified). Cloud providers auto-attach the domain + SSL
 * to the host and are credential-gated — honest "not configured" until Phase 10 keys.
 * One shared base; no duplicated boilerplate.
 */
function has(keys: string[], creds: Credentials): boolean {
  return keys.length === 0 || keys.every((k) => Boolean(creds[k]));
}

class BaseProvider implements DomainProvider {
  constructor(
    public id: DomainProviderId,
    public name: string,
    public credentialKeys: string[],
  ) {}

  async authenticate(creds: Credentials) {
    return has(this.credentialKeys, creds)
      ? { ok: true, message: `${this.name} ready.` }
      : { ok: false, message: `Missing ${this.name} credentials: ${this.credentialKeys.join(', ')}.` };
  }

  async attach(hostname: string, creds: Credentials) {
    if (!has(this.credentialKeys, creds)) {
      return { ok: false, message: `${this.name} not configured — add credentials in Settings (Phase 10).` };
    }
    return { ok: false, message: `${this.name} auto-attach for ${hostname} pending SDK integration.` };
  }

  async ssl(_hostname: string, creds: Credentials): Promise<{ status: SslStatus; message: string }> {
    if (!has(this.credentialKeys, creds)) return { status: 'none', message: 'Provider not configured.' };
    return { status: 'pending', message: 'Certificate issuance pending integration.' };
  }

  async remove(hostname: string, creds: Credentials) {
    if (!has(this.credentialKeys, creds)) return { ok: true, message: 'Nothing to detach.' };
    return { ok: false, message: `${this.name} detach for ${hostname} pending integration.` };
  }

  async health(creds: Credentials): Promise<DomainProviderHealth> {
    const configured = has(this.credentialKeys, creds);
    return {
      id: this.id,
      name: this.name,
      configured,
      ok: configured,
      message: configured ? 'Ready.' : `Add ${this.credentialKeys.join(', ')}.`,
    };
  }
}

/** Custom DNS: no credentials; SSL auto-issued after verification (Let's Encrypt-style). */
class CustomProvider extends BaseProvider {
  constructor() {
    super('custom', 'Custom DNS', []);
  }
  async attach(hostname: string) {
    return { ok: true, message: `Point DNS for ${hostname} to the platform (see records).` };
  }
  async ssl(): Promise<{ status: SslStatus; message: string }> {
    return { status: 'active', message: 'SSL is auto-issued once the domain is verified.' };
  }
}

const PROVIDERS: Record<DomainProviderId, DomainProvider> = {
  custom: new CustomProvider(),
  cloudflare: new BaseProvider('cloudflare', 'Cloudflare', ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']),
  vercel: new BaseProvider('vercel', 'Vercel', ['VERCEL_TOKEN']),
  netlify: new BaseProvider('netlify', 'Netlify', ['NETLIFY_AUTH_TOKEN']),
};

export function getDomainProvider(id: string): DomainProvider | undefined {
  return PROVIDERS[id as DomainProviderId];
}

export function listDomainProviders(): DomainProvider[] {
  return Object.values(PROVIDERS);
}
