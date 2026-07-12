import type {
  DeploymentProvider,
  DeploymentInput,
  DeploymentResult,
  DeployStatus,
  ProviderCredentials,
  ProviderHealth,
  ValidationResult,
} from '@/lib/deployment/types';

/**
 * Shared provider helpers + a base class implementing the common, honest behavior
 * for hosts that require credentials. Concrete cloud providers extend this and only
 * override what genuinely differs — no duplicated boilerplate across 7 providers.
 */

export function line(msg: string): string {
  return msg;
}

/** Are all required credential keys present + non-empty? */
export function hasCredentials(keys: string[], creds: ProviderCredentials): boolean {
  return keys.length > 0 && keys.every((k) => Boolean(creds[k]));
}

const notConfigured = (name: string): DeploymentResult => ({
  ok: false,
  status: 'ERROR',
  error: `${name} is not configured. Add credentials in Settings → API Keys (Phase 10) to enable live deploys.`,
  logs: [line(`[${name}] no credentials found — skipping live deploy.`)],
});

/**
 * Base for credential-gated cloud providers. Implements the full 9-method interface
 * with honest "not configured" behavior; subclasses set id/name/credentialKeys and
 * may override `deploy`/etc. once a real integration + credentials exist.
 */
export abstract class CredentialProvider implements DeploymentProvider {
  abstract id: DeploymentProvider['id'];
  abstract name: string;
  abstract credentialKeys: string[];

  async authenticate(creds: ProviderCredentials) {
    return hasCredentials(this.credentialKeys, creds)
      ? { ok: true, message: `${this.name} credentials present.` }
      : { ok: false, message: `Missing ${this.name} credentials: ${this.credentialKeys.join(', ')}.` };
  }

  async validate(input: DeploymentInput): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.websiteSlug) errors.push('Website slug is required.');
    if (!hasCredentials(this.credentialKeys, input.credentials)) {
      errors.push(`Missing credentials: ${this.credentialKeys.join(', ')}.`);
    }
    return { ok: errors.length === 0, errors };
  }

  async deploy(input: DeploymentInput): Promise<DeploymentResult> {
    const auth = await this.authenticate(input.credentials);
    if (!auth.ok) return notConfigured(this.name);
    // Real API integration lands with Phase 10 credentials; keep it honest until then.
    return {
      ok: false,
      status: 'ERROR',
      error: `${this.name} live deploy not yet integrated (credentials present).`,
      logs: [line(`[${this.name}] credentials OK; live deploy integration pending.`)],
    };
  }

  async update(input: DeploymentInput) {
    return this.deploy(input);
  }

  async rollback(_deploymentId: string, input: DeploymentInput): Promise<DeploymentResult> {
    const auth = await this.authenticate(input.credentials);
    if (!auth.ok) return notConfigured(this.name);
    return { ok: false, status: 'ERROR', error: `${this.name} rollback pending integration.`, logs: [] };
  }

  async remove(_deploymentId: string, input: DeploymentInput): Promise<DeploymentResult> {
    const auth = await this.authenticate(input.credentials);
    if (!auth.ok) return notConfigured(this.name);
    return { ok: false, status: 'ERROR', error: `${this.name} remove pending integration.`, logs: [] };
  }

  async verify(url: string) {
    return { ok: Boolean(url), message: url ? `Would verify ${url}.` : 'No URL to verify.' };
  }

  async status(_deploymentId: string): Promise<{ status: DeployStatus; message: string }> {
    return { status: 'QUEUED', message: `${this.name} status pending integration.` };
  }

  async logs(_deploymentId: string): Promise<string[]> {
    return [line(`[${this.name}] no logs (integration pending).`)];
  }

  async health(creds: ProviderCredentials): Promise<ProviderHealth> {
    const configured = hasCredentials(this.credentialKeys, creds);
    return {
      id: this.id,
      name: this.name,
      configured,
      ok: configured,
      message: configured ? 'Credentials present.' : `Add ${this.credentialKeys.join(', ')}.`,
    };
  }
}
