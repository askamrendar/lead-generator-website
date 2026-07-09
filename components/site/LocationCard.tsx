import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LocationCardProps {
  name: string;
  href: string;
  meta?: string;
}

export function LocationCard({ name, href, meta }: LocationCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href={href} className="font-semibold hover:text-brand">
            {name}
          </Link>
          {meta && <p className="truncate text-xs text-muted-fg">{meta}</p>}
        </div>
        <ArrowRight className="size-4 text-muted-fg transition-transform group-hover:translate-x-0.5" />
      </CardContent>
    </Card>
  );
}
