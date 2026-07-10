'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { useToast } from '@/components/ui/toast';

/**
 * Accept a team invitation. Requires an authenticated session whose email matches
 * the invite (enforced server-side); a 401 redirects to sign-in and returns here.
 * Invitation *creation* ships with Team Collaboration (Phase 9); this consumes an
 * existing invite token.
 */
export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.status === 401) {
        const cb = encodeURIComponent(`/invitations/${token}`);
        router.push(`/login?callbackUrl=${cb}`);
        return;
      }
      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Invitation accepted',
          description: 'You now have access to the organization.',
        });
        router.push('/dashboard');
        return;
      }
      toast({
        variant: 'error',
        title: 'Could not accept invitation',
        description: 'The invitation may be invalid, expired, or for a different email.',
      });
    } catch {
      toast({ variant: 'error', title: 'Network error', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoadingButton
      type="button"
      size="lg"
      className="w-full"
      loading={loading}
      loadingText="Accepting…"
      onClick={accept}
    >
      Accept invitation
    </LoadingButton>
  );
}
