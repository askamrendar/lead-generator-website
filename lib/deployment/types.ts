/**
 * Deployment Engine — provider abstraction (Phase 8.0).
 *
 * The engine owns publishing; the Website Builder never deploys and never imports
 * this module. Every host implements the same `DeploymentProvider` interface and is
 * registered in `registry.ts`. Live cloud deploys require provider credentials
 * (wired via Phase 10 API keys); without them a provider reports "not configured"
 * honestly rather than faking a deploy.
 */

export type ProviderId =
  | 'zip'
  | 'cloudflare'
  | 'vercel'
  | 'netlify'
  | 'docker'
  | 'github'
  | 'custom';

export type DeployStatus =
  | 'QUEUED'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'READY'
  | 'ERROR'
  | 'CANCELLED'
  | 'ROLLED_BACK';

export type Environment = 'production' | 'preview';

export type ProviderCredentials = Record<string, string | undefined>;

export interface DeploymentInput {
  websiteId: string;
  websiteSlug: string;
  provider: ProviderId;
  environment: Environment;
  envVars: Record<string, string>;
  /** The config to publish (e.g. builderConfig) — engine passes it through opaquely. */
  artifact: unknown;
  credentials: ProviderCredentials;
}

export interface DeploymentResult {
  ok: boolean;
  status: DeployStatus;
  url?: string;
  error?: string;
  logs: string[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ProviderHealth {
  id: ProviderId;
  name: string;
  configured: boolean;
  ok: boolean;
  message: string;
}

/**
 * The uniform contract every provider implements. The engine/service call these;
 * the UI never talks to a provider directly.
 */
export interface DeploymentProvider {
  id: ProviderId;
  name: string;
  /** Credential keys this provider expects (shown in Settings). */
  credentialKeys: string[];

  authenticate(creds: ProviderCredentials): Promise<{ ok: boolean; message: string }>;
  validate(input: DeploymentInput): Promise<ValidationResult>;
  deploy(input: DeploymentInput): Promise<DeploymentResult>;
  update(input: DeploymentInput): Promise<DeploymentResult>;
  rollback(deploymentId: string, input: DeploymentInput): Promise<DeploymentResult>;
  remove(deploymentId: string, input: DeploymentInput): Promise<DeploymentResult>;
  verify(url: string): Promise<{ ok: boolean; message: string }>;
  status(deploymentId: string): Promise<{ status: DeployStatus; message: string }>;
  logs(deploymentId: string): Promise<string[]>;
  health(creds: ProviderCredentials): Promise<ProviderHealth>;
}
