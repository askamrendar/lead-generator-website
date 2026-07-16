import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

// Product branding: the dashboard is the SaaS app, not the sample tenant site —
// override the root layout's sample-business title template/description/identity.
export const metadata: Metadata = {
  title: { default: 'Dashboard | Local Sites Pro', template: '%s | Local Sites Pro' },
  description: 'Manage, generate, and deploy your local-business websites.',
  applicationName: 'Local Sites Pro',
  authors: [],
  robots: { index: false, follow: false },
};

// The shell reads session + cookies (per-request), so dashboard routes are dynamic.
export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
