import { CredentialProvider } from '@/lib/deployment/providers/base';
import type { ProviderId } from '@/lib/deployment/types';

/**
 * Credential-gated cloud/host providers. Each is a thin subclass of
 * `CredentialProvider` — it declares its id, name, and required credential keys and
 * inherits the honest 9-method behavior (validate + authenticate work; live
 * deploy/rollback/remove report "integration pending" until Phase 10 credentials +
 * SDK wiring land). No duplicated boilerplate across providers.
 */

class Cloud extends CredentialProvider {
  id: ProviderId;
  name: string;
  credentialKeys: string[];
  constructor(id: ProviderId, name: string, keys: string[]) {
    super();
    this.id = id;
    this.name = name;
    this.credentialKeys = keys;
  }
}

export class CloudflareProvider extends Cloud {
  constructor() { super('cloudflare', 'Cloudflare Pages', ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']); }
}
export class VercelProvider extends Cloud {
  constructor() { super('vercel', 'Vercel', ['VERCEL_TOKEN']); }
}
export class NetlifyProvider extends Cloud {
  constructor() { super('netlify', 'Netlify', ['NETLIFY_AUTH_TOKEN']); }
}
export class DockerProvider extends Cloud {
  constructor() { super('docker', 'Docker', ['DOCKER_REGISTRY', 'DOCKER_TOKEN']); }
}
export class GithubProvider extends Cloud {
  constructor() { super('github', 'GitHub Pages', ['GITHUB_TOKEN', 'GITHUB_REPO']); }
}
export class CustomServerProvider extends Cloud {
  constructor() { super('custom', 'Custom Server', ['SSH_HOST', 'SSH_USER', 'SSH_KEY']); }
}
