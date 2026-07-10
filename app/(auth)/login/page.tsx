import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { enabledOAuthProviders } from '@/lib/auth/providers/enabled';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const providers = enabledOAuthProviders();

  return (
    <AuthCard title="Welcome back" description="Sign in to continue to your dashboard.">
      <LoginForm
        providers={providers}
        callbackUrl={callbackUrl ?? '/dashboard'}
        initialError={error}
      />
    </AuthCard>
  );
}
