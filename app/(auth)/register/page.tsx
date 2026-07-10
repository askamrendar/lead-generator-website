import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { enabledOAuthProviders } from '@/lib/auth/providers/enabled';

export const metadata: Metadata = { title: 'Create your account' };

// Dynamic so the enabled OAuth providers reflect runtime env.
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const providers = enabledOAuthProviders();

  return (
    <AuthCard
      title="Create your account"
      description="Start building lead-generating websites in minutes."
    >
      <RegisterForm providers={providers} />
    </AuthCard>
  );
}
