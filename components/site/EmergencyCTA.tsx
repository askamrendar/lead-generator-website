import { Phone, Siren } from 'lucide-react';
import { formatPhone, telHref } from '@/lib/utils';

/** High-contrast emergency band with click-to-call. */
export function EmergencyCTA({
  title,
  description,
  phone,
}: {
  title: string;
  description: string;
  phone: string;
}) {
  return (
    <section className="bg-accent text-accent-fg">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-center sm:flex-row sm:text-left">
        <div className="flex items-start gap-3">
          <Siren className="mt-1 size-6 shrink-0" />
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 max-w-2xl text-accent-fg/90">{description}</p>
          </div>
        </div>
        <a
          href={telHref(phone)}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-accent-fg px-6 py-3 font-semibold text-accent shadow-sm hover:brightness-95"
        >
          <Phone className="size-5" /> {formatPhone(phone)}
        </a>
      </div>
    </section>
  );
}
