import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

/**
 * Edge-runtime auth instance for middleware, built from the Edge-safe config only
 * (JWT strategy, no Prisma adapter, no Node crypto). The `authorized` callback in
 * authConfig performs the actual allow/deny; unauthenticated hits on matched routes
 * are redirected to the sign-in page.
 */
// The route matcher lives in the root middleware.ts as a static literal (Next
// inlines `config.matcher` at build time and cannot read an imported value). It
// scopes this guard to reserved authenticated areas (/dashboard, /app) introduced
// in Phase 7.2; public marketing/generation routes are intentionally excluded.
export const { auth: authMiddleware } = NextAuth(authConfig);
