import { loadDashboardContext } from '@/lib/dashboard/context';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default async function ProfileSettingsPage() {
  const ctx = await loadDashboardContext();
  return (
    <Panel title="Profile" description="Your account identity across the platform.">
      <InfoList
        items={[
          ['Name', ctx?.user.name ?? '—'],
          ['Email', ctx?.user.email ?? '—'],
        ]}
      />
      <p className="mt-3 text-xs text-muted-fg">
        Editable profile fields and avatar upload arrive with the Media milestone.
      </p>
    </Panel>
  );
}
