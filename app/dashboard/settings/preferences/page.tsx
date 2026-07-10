import { Panel } from '@/components/ui/panel';
import { ThemeToggle } from '@/components/theme/theme';

export default function PreferencesSettingsPage() {
  return (
    <Panel title="Preferences" description="Personalize how the dashboard looks and behaves.">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-sm text-muted-fg">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </div>
    </Panel>
  );
}
