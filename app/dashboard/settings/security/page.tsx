import { Shield } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default function SecuritySettingsPage() {
  return (
    <Panel title="Security" description="Protect your account and sessions.">
      <InfoList
        items={[
          ['Password', 'Change via the reset flow'],
          ['Sessions', 'JWT-based'],
          ['Two-factor auth', 'Planned'],
          ['Passkeys', 'Planned'],
        ]}
      />
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-fg">
        <Shield className="size-3.5" aria-hidden />
        MFA and passkey management are future enhancements.
      </p>
    </Panel>
  );
}
