import Link from 'next/link';
import { Phone, MessageSquare } from 'lucide-react';
import { formatPhone, telHref } from '@/lib/utils';
import { paths } from '@/lib/generator/config';

/**
 * Mobile-first conversion bar: a sticky click-to-call + quote CTA pinned to the
 * bottom of the viewport on small screens.
 */
export function StickyCallButton({ phone }: { phone: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <a
        href={telHref(phone)}
        className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand"
      >
        <Phone className="size-4" />
        Call {formatPhone(phone)}
      </a>
      <Link
        href={paths.contact()}
        className="flex items-center justify-center gap-2 bg-accent py-3 text-sm font-semibold text-accent-fg"
      >
        <MessageSquare className="size-4" />
        Free Quote
      </Link>
    </div>
  );
}
