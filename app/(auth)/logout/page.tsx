import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LogoutClient } from '@/components/auth/LogoutClient';

export const metadata: Metadata = { title: 'Sign out' };

export default function LogoutPage() {
  return (
    <AuthCard title="Signing out">
      <LogoutClient />
    </AuthCard>
  );
}
