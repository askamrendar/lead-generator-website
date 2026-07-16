import Link from 'next/link';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { InfoList } from '@/components/dashboard/InfoList';

export default function DomainsSettingsPage() {
  return (
    <Panel title="Domains" description="Custom domains are managed per website.">
      <InfoList
        items={[
          ['Where to connect', 'Website → Domains tab'],
          ['Verification', 'DNS TXT record (checked live)'],
          ['Serving', 'Verified + active domains serve the published site automatically'],
        ]}
      />
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/domains">Open the Domains overview</Link>
        </Button>
      </div>
    </Panel>
  );
}
