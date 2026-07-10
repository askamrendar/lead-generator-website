import { authMiddleware } from '@/lib/auth/middleware';

/**
 * Next.js middleware entry point. Delegates to the Edge-safe auth guard; the
 * matcher scopes it to reserved authenticated areas only.
 *
 * NOTE: `config.matcher` must be a statically-analyzable literal (Next inlines it at
 * build time), so it is declared here rather than imported.
 */
export default authMiddleware;

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/app', '/app/:path*'],
};
