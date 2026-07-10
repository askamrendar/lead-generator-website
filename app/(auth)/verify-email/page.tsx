import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { VerifyEmailClient } from '@/components/auth/VerifyEmailClient';

export const metadata: Metadata = { title: 'Verify email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard title="Email verification">
      <VerifyEmailClient token={token} />
    </AuthCard>
  );
}
