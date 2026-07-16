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
 * The deployment artifact is a REAL static-site archive: every page rendered to
 * HTML (via lib/export/static-site) + stylesheet + robots/sitemap/favicon, served
 * by the export API route. Upload the unzipped folder to any static host.
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
        line('[zip] rendering every page of the site to static HTML…'),
        line('[zip] static site archive ready — download from the deployment.'),
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
