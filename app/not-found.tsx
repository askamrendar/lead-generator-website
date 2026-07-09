import Link from 'next/link';
import { Home, Phone } from 'lucide-react';
import { business } from '@/data/business';
import { Button } from '@/components/ui/button';
import { formatPhone, telHref } from '@/lib/utils';
import { paths } from '@/lib/generator/config';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-fg">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        Let&rsquo;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={paths.home()}>
            <Home className="size-5" /> Back to Home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={telHref(business.phone)}>
            <Phone className="size-5" /> Call {formatPhone(business.phone)}
          </a>
        </Button>
      </div>
    </div>
  );
}
