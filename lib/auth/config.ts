import type { NextAuthConfig } from 'next-auth';
import { googleProvider } from '@/lib/auth/providers/google';
import { githubProvider } from '@/lib/auth/providers/github';

/**
 * Edge-safe Auth.js configuration.
 *
 * Contains ONLY what can run on the Edge runtime (used by middleware): the JWT
 * session strategy, page overrides, OAuth providers (which do no Node I/O at
 * import), and lightweight callbacks. The Prisma adapter and the Credentials
 * provider (Node-only: DB + scrypt) are attached separately in lib/auth/auth.ts.
 *
 * This split is the documented Auth.js pattern that keeps middleware Edge-compatible
 * while route handlers get the full Node capabilities.
 */

// OAuth providers self-disable when their env secrets are absent (offline-safe).
const oauthProviders = [googleProvider(), githubProvider()].filter(
  (p): p is NonNullable<typeof p> => p !== null,
);

/**
 * Whether to trust the incoming Host/X-Forwarded-Host header when resolving the
 * callback origin. Auth.js requires this behind a reverse proxy / non-Vercel host,
 * or sign-in fails with `UntrustedHost` in production.
 *
 * Secure default: trusted automatically in development and on Vercel; in any other
 * production deployment it must be explicitly acknowledged with AUTH_TRUST_HOST=true
 * (you are asserting the proxy sets a correct, non-spoofable Host header).
 */
const trustHost =
  process.env.AUTH_TRUST_HOST === 'true' ||
  process.env.NODE_ENV !== 'production' ||
  process.env.VERCEL === '1';

export const authConfig = {
  trustHost,
  // Credentials provider requires the JWT strategy; database sessions can be
  // adopted later once only OAuth/email providers are in use.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: oauthProviders,
  callbacks: {
    /**
     * Middleware gate: matched (protected) routes require an authenticated user.
     * The matcher in middleware.ts scopes this to the authed areas only.
     */
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
