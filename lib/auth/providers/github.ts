import GitHub from 'next-auth/providers/github';
import type { Provider } from 'next-auth/providers';

/**
 * GitHub OAuth — enabled only when both AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are
 * set. Returns null otherwise so the app stays fully functional offline (Credentials
 * sign-in only). Edge-safe: no Node-only imports.
 */
export function githubProvider(): Provider | null {
  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  if (!clientId || !clientSecret) return null;
  return GitHub({ clientId, clientSecret, allowDangerousEmailAccountLinking: false });
}
