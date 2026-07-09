import Link from 'next/link';
import { ArrowRight, Wrench, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paths, type ResolvedService } from '@/lib/generator/config';

export function ServiceCard({ service }: { service: ResolvedService }) {
  const Icon = service.emergency ? Zap : Wrench;
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon className="size-5" />
          </span>
          {service.emergency && <Badge variant="accent">24/7</Badge>}
        </div>
        <h3 className="text-lg font-semibold">{service.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-fg">
          {service.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between">
          {service.startingPrice && (
            <span className="text-sm font-semibold text-foreground">
              From {service.startingPrice}
            </span>
          )}
          <Link
            href={paths.service(service.slug)}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand"
          >
            Learn more
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
