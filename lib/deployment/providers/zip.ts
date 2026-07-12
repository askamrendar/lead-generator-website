import type {
  DeploymentProvider,
  DeploymentInput,
  DeploymentResult,
  DeployStatus,
  ProviderCredentials,
  ProviderHealth,
  ValidationResult,
} from '@/lib/deployment/types';
import { line } from '@/lib/deployment/providers/base';

/**
 * ZIP Export provider — the one provider that works with NO external credentials.
 * It packages the website's publishable config bundle for download (served by the
 * export API route). A full static-HTML archive depends on the AI Generator's output;
 * until then this exports the config bundle honestly.
 */
export class ZipProvider implements DeploymentProvider {
  id = 'zip' as const;
  name = 'ZIP Export';
  credentialKeys: string[] = [];

  async authenticate(_creds: ProviderCredentials) {
    return { ok: true, message: 'ZIP export needs no credentials.' };
  }

  async validate(input: DeploymentInput): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.websiteSlug) errors.push('Website slug is required.');
    if (input.artifact == null) errors.push('Nothing to export — build or generate the site first.');
    return { ok: errors.length === 0, errors };
  }

  async deploy(input: DeploymentInput): Promise<DeploymentResult> {
    const v = await this.validate(input);
    if (!v.ok) return { ok: false, status: 'ERROR', error: v.errors.join(' '), logs: v.errors.map(line) };
    return {
      ok: true,
      status: 'READY',
      url: `/api/websites/${input.websiteId}/export`,
      logs: [
        line('[zip] packaging website configuration bundle…'),
        line('[zip] bundle ready — download from the deployment.'),
      ],
    };
  }

  async update(input: DeploymentInput) {
    return this.deploy(input);
  }

  async rollback(): Promise<DeploymentResult> {
    return { ok: false, status: 'ERROR', error: 'ZIP export has no rollback — re-export instead.', logs: [] };
  }

  async remove(): Promise<DeploymentResult> {
    return { ok: true, status: 'ROLLED_BACK', logs: [line('[zip] export bundles are ephemeral; nothing to remove.')] };
  }

  async verify(url: string) {
    return { ok: Boolean(url), message: url ? 'Export bundle available.' : 'No export URL.' };
  }

  async status(): Promise<{ status: DeployStatus; message: string }> {
    return { status: 'READY', message: 'ZIP export is synchronous.' };
  }

  async logs(): Promise<string[]> {
    return [line('[zip] export completed.')];
  }

  async health(): Promise<ProviderHealth> {
    return { id: this.id, name: this.name, configured: true, ok: true, message: 'Always available (no credentials).' };
  }
}
