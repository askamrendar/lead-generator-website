import { HelpCircle, LifeBuoy } from 'lucide-react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';

export default function HelpPage() {
  const links = [
    { label: 'Product roadmap', href: '/', note: 'What we are building next.' },
    { label: 'Documentation', href: '/', note: 'Guides and references.' },
    { label: 'Contact support', href: '/contact', note: 'Get help from our team.' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Help & Support" description="Guides, resources, and ways to reach us." />
      <div className="grid gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <Card key={l.label} className="p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-fg">
              <LifeBuoy className="size-5" aria-hidden />
            </div>
            <a href={l.href} className="text-sm font-semibold text-foreground hover:underline">
              {l.label}
            </a>
            <p className="mt-1 text-sm text-muted-fg">{l.note}</p>
          </Card>
        ))}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-fg">
        <HelpCircle className="size-4" aria-hidden />
        More help resources are on the way.
      </p>
    </PageContainer>
  );
}
