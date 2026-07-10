import { loadDashboardContext } from '@/lib/dashboard/context';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default async function WorkspaceSettingsPage() {
  const ctx = await loadDashboardContext();
  const ws = ctx?.currentWorkspace;
  return (
    <Panel title="Workspace" description="A container for your projects and websites.">
      <InfoList
        items={[
          ['Name', ws?.name ?? '—'],
          ['Slug', ws ? `/${ws.slug}` : '—'],
          ['Workspaces in org', ctx?.workspaces.length ?? 0],
        ]}
      />
    </Panel>
  );
}
