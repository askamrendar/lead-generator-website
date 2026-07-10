'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OAuthProviderId } from '@/lib/auth/providers/enabled';

/**
 * Social sign-in buttons for the OAuth providers the server reports as enabled.
 * Renders nothing (plus caller-controlled divider) when none are configured, so the
 * offline/credentials-only setup shows a clean form. Uses the client `signIn`.
 */

const LABELS: Record<OAuthProviderId, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 11v3.6h5.1c-.2 1.3-1.6 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.6S8.9 7.3 12 7.3c1.8 0 2.9.8 3.6 1.4l2.5-2.4C16.5 4.8 14.5 4 12 4 7.6 4 4 7.6 4 12s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5 0-.9-.1-1.2H12z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z"
      />
    </svg>
  );
}

const ICONS: Record<OAuthProviderId, React.ReactNode> = {
  google: <GoogleIcon />,
  github: <GitHubIcon />,
};

export function OAuthButtons({
  providers,
  callbackUrl = '/dashboard',
}: {
  providers: OAuthProviderId[];
  callbackUrl?: string;
}) {
  const [pending, setPending] = React.useState<OAuthProviderId | null>(null);
  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      {providers.map((id) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          disabled={pending !== null}
          aria-busy={pending === id}
          onClick={() => {
            setPending(id);
            void signIn(id, { callbackUrl });
          }}
        >
          {pending === id ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            ICONS[id]
          )}
          {LABELS[id]}
        </Button>
      ))}
    </div>
  );
}
