'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

/** Signs the user out on mount and returns them to the sign-in page. */
export function LogoutClient() {
  React.useEffect(() => {
    void signOut({ callbackUrl: '/login' });
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
      <p className="text-sm text-muted-fg">Signing you out…</p>
    </div>
  );
}
