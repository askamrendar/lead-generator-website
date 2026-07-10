import { loadDashboardContext } from '@/lib/dashboard/context';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default async function OrganizationSettingsPage() {
  const ctx = await loadDashboardContext();
  const org = ctx?.currentOrg;
  return (
    <Panel title="Organization" description="The tenant that owns your workspaces and websites.">
      <InfoList
        items={[
          ['Name', org?.name ?? '—'],
          ['Slug', org ? `/${org.slug}` : '—'],
          ['Your role', org?.role ?? '—'],
          ['Members', 'Managed in Team (Phase 9)'],
        ]}
      />
    </Panel>
  );
}
