/**
 * Which OAuth providers are actually configured (both id + secret present). Server
 * -only (reads env). The auth pages call this and pass the result to `OAuthButtons`,
 * so buttons appear only for usable providers — offline-safe by default.
 *
 * Single source of truth for "is this provider on", mirrored by the provider
 * factories in `lib/auth/providers/{google,github}.ts`.
 */
export type OAuthProviderId = 'google' | 'github';

export function enabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push('google');
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push('github');
  }
  return providers;
}
