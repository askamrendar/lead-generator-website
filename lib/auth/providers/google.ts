import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';

/**
 * Google OAuth — enabled only when both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are
 * set. Returns null otherwise so the app stays fully functional offline (Credentials
 * sign-in only). Edge-safe: no Node-only imports.
 */
export function googleProvider(): Provider | null {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;
  return Google({ clientId, clientSecret, allowDangerousEmailAccountLinking: false });
}
