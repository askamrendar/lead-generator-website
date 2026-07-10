import * as React from 'react';
import Link from 'next/link';
import { Paintbrush, Sparkles } from 'lucide-react';
import { getWebsite } from '@/lib/websites/service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/websites/StatusBadge';
import {
  generationBadge,
  seoBadge,
  deploymentBadge,
  domainBadge,
} from '@/lib/websites/status';
import { websiteHref } from '@/lib/websites/nav';

function StatusRow({ label, badge }: { label: string; badge: { label: string; tone: 'neutral' | 'success' | 'warning' | 'info' } }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <span className="text-sm text-muted-fg">{label}</span>
      <StatusBadge badge={badge} />
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}

export default async function WebsiteOverviewPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const website = await getWebsite(websiteId);
  const bc = website.businessConfig;

  const location = bc
    ? [bc.location.city, bc.location.state, bc.location.country].filter(Boolean).join(', ')
    : '';
  const services = bc
    ? [bc.business.primaryService, ...(bc.business.additionalServices ?? [])].filter(Boolean).join(', ')
    : '';
  const contact = bc ? [bc.details.phone, bc.details.email].filter(Boolean).join(' · ') : '';

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusRow label="Content" badge={generationBadge(website)} />
        <StatusRow label="SEO" badge={seoBadge(website)} />
        <StatusRow label="Deployment" badge={deploymentBadge()} />
        <StatusRow label="Domain" badge={domainBadge()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Business information</h2>
          </div>
          <dl className="divide-y divide-border">
            <Detail label="Business" value={bc?.business.businessName ?? website.name} />
            <Detail label="Category" value={bc?.business.category ?? ''} />
            <Detail label="Services" value={services} />
            <Detail label="Location" value={location} />
            <Detail label="Contact" value={contact} />
            <Detail label="Language / Timezone" value={`${website.language} · ${website.timezone}`} />
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Next steps</h2>
          <p className="mt-1 text-sm text-muted-fg">
            Generate content and edit this website (available in upcoming milestones).
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href={websiteHref(website.id, 'ai-generator')}>
                <Sparkles aria-hidden />
                Generate with AI
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={websiteHref(website.id, 'builder')}>
                <Paintbrush aria-hidden />
                Open builder
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
