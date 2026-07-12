import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutTemplate, ArrowRight } from 'lucide-react';
import { listBlueprints, blueprintCategories } from '@/lib/productivity/templates';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Website Templates' };

/**
 * Website Templates / Blueprint Library. Each blueprint pre-fills the create wizard
 * (via `?blueprint=`), reusing the existing Website creation flow — no duplicate CRUD.
 */
export default function TemplatesPage() {
  const blueprints = listBlueprints();
  const categories = blueprintCategories();

  return (
    <PageContainer>
      <PageHeader title="Website Templates" description="Start from a ready-made blueprint tuned for a local service business." />
      {categories.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blueprints
              .filter((b) => b.category === category)
              .map((b) => (
                <Card key={b.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <LayoutTemplate className="size-5 text-brand" aria-hidden />
                    <Badge variant="muted">{b.industryId}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="mt-1 flex-1 text-sm text-muted-fg">{b.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {b.services.slice(0, 3).map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-fg">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/dashboard/websites/new?blueprint=${b.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    Use blueprint <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </PageContainer>
  );
}
