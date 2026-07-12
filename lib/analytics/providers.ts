import type { AnalyticsProvider, Credentials, ExternalSource } from '@/lib/analytics/types';

/**
 * External analytics providers (GA4, Google Search Console). Credential-gated: they
 * report an honest "awaiting credentials" state until Phase 10 API keys are wired.
 * The service surfaces their status; no fabricated traffic/ranking numbers.
 */
function configured(keys: string[], creds: Credentials): boolean {
  return keys.length > 0 && keys.every((k) => Boolean(creds[k]));
}

class ExternalProvider implements AnalyticsProvider {
  constructor(
    public id: ExternalSource['id'],
    public name: string,
    public credentialKeys: string[],
  ) {}

  isConfigured(creds: Credentials): boolean {
    return configured(this.credentialKeys, creds);
  }

  status(creds: Credentials): ExternalSource {
    const ok = this.isConfigured(creds);
    return {
      id: this.id,
      name: this.name,
      configured: ok,
      awaiting: !ok,
      message: ok
        ? `${this.name} connected (data sync pending integration).`
        : `Awaiting credentials: ${this.credentialKeys.join(', ')} (Settings → API Keys).`,
    };
  }
}

const PROVIDERS: AnalyticsProvider[] = [
  new ExternalProvider('ga4', 'Google Analytics 4', ['GA4_PROPERTY_ID', 'GA4_CREDENTIALS_JSON']),
  new ExternalProvider('search-console', 'Google Search Console', ['GSC_SITE_URL', 'GSC_CREDENTIALS_JSON']),
];

export function externalSources(creds: Credentials): ExternalSource[] {
  return PROVIDERS.map((p) => p.status(creds));
}
