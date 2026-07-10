import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation: expose the user id on the session and JWT so tenant/RBAC
 * helpers (lib/auth/session.ts) can resolve memberships without another lookup.
 */
declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
