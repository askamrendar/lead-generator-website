'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';

/**
 * Consumes an email-verification token (from the emailed link's `?token=`) against
 * the API and reflects the outcome. Runs once on mount.
 */
export function VerifyEmailClient({ token }: { token?: string }) {
  const [state, setState] = React.useState<'pending' | 'success' | 'error'>('pending');

  React.useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (active) setState(res.ok ? 'success' : 'error');
      } catch {
        if (active) setState('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (state === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
        <p className="text-sm text-muted-fg">Verifying your email…</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" aria-hidden />
        <p className="text-sm text-foreground">Your email is verified. You can sign in now.</p>
        <Link href="/login" className="text-sm font-medium text-brand hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <TriangleAlert className="size-8 text-red-600 dark:text-red-400" aria-hidden />
      <p className="text-sm text-foreground">
        This verification link is invalid or has expired.
      </p>
      <Link href="/login" className="text-sm font-medium text-brand hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
