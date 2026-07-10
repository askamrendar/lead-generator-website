import type { Metadata } from 'next';
import Link from 'next/link';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/theme/theme';
import { business } from '@/data/business';

/**
 * Authenticated-experience shell. Chrome-free (the marketing Header/Footer are
 * suppressed on these routes by SiteChrome) and centered, with a brand mark, theme
 * toggle, and the toast provider that auth forms use. Auth routes are noindex.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-foreground transition-opacity hover:opacity-80"
          >
            {business.name}
          </Link>
          <ThemeToggle />
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-muted-fg">
          © {business.name}. All rights reserved.
        </p>
      </div>
    </ToastProvider>
  );
}
