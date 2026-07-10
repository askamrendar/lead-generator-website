import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { authAdapter } from '@/lib/auth/adapter/prisma';
import { credentialsProvider } from '@/lib/auth/providers/credentials';
import { provisionNewUser } from '@/lib/auth/provisioning';

/**
 * Full (Node runtime) Auth.js instance — used by route handlers and server code.
 *
 * Extends the Edge-safe `authConfig` with the Prisma adapter and the Credentials
 * provider (both Node-only). New OAuth users are provisioned with their initial
 * tenant via the `createUser` event; Credentials users are provisioned in the
 * register route right after creation (same `provisionNewUser` helper).
 *
 * Consumers:
 *   - app/api/auth/[...nextauth]/route.ts → `handlers`
 *   - server components / route handlers   → `auth()`
 *   - programmatic sign-in/out             → `signIn` / `signOut`
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: authAdapter,
  providers: [...authConfig.providers, credentialsProvider],
  events: {
    async createUser({ user }) {
      if (user.id) await provisionNewUser(user.id);
    },
  },
});
