import { Rocket } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default function DeploymentProvidersSettingsPage() {
  return (
    <Panel title="Deployment Providers" description="Connect the hosts you can publish websites to.">
      <p className="mb-3 text-sm text-muted-fg">
        Deployment uses a provider abstraction (approved). Provider connections and credentials
        will be managed here when Deployment ships (Phase 8). No provider logic exists yet.
      </p>
      <InfoList
        items={[
          ['Planned providers', 'ZIP · Cloudflare · Vercel · Netlify · GitHub · Docker · Static · Self-hosted'],
          ['Status', 'UI-only preparation'],
          ['Milestone', 'Phase 8'],
        ]}
      />
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-fg">
        <Rocket className="size-3.5" aria-hidden />
        Ready for Phase 8.
      </p>
    </Panel>
  );
}
