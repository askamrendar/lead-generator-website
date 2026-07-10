import type { Metadata } from 'next';
import {
  Activity,
  BarChart3,
  Gauge,
  Link2,
  ListChecks,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listWorkspaceWebsites } from '@/lib/websites/service';
import { Card } from '@/components/ui/card';
import { Panel } from '@/components/ui/panel';
import { QuickActions } from '@/components/dashboard/home/QuickActions';
import { RecentWebsites } from '@/components/dashboard/home/RecentWebsites';
import { SoonPanel } from '@/components/dashboard/home/SoonPanel';
import type { WebsiteSummary } from '@/lib/websites/types';

export const metadata: Metadata = { title: 'Dashboard' };

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name: string | null, email: string | null): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0]!;
  if (email) return email.split('@')[0]!;
  return 'there';
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted-fg">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </Card>
  );
}

export default async function DashboardHomePage() {
  const ctx = await loadDashboardContext();
  const now = Date.now();
  const hour = new Date(now).getHours();

  let websites: WebsiteSummary[] = [];
  if (ctx?.currentWorkspace) {
    websites = await listWorkspaceWebsites(ctx.currentWorkspace.id, { includeArchived: true });
  }

  const active = websites.filter((w) => w.status !== 'ARCHIVED');
  const drafts = websites.filter((w) => w.status === 'DRAFT').length;
  const published = websites.filter((w) => w.status === 'PUBLISHED').length;
  const recent = active.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting(hour)}, {firstName(ctx?.user.name ?? null, ctx?.user.email ?? null)}
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          {ctx?.currentWorkspace
            ? `Here's what's happening in ${ctx.currentWorkspace.name}.`
            : 'Welcome to your workspace.'}
        </p>
      </div>

      {/* Real, honest counts from the workspace */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total websites" value={active.length} />
        <MiniStat label="Drafts" value={drafts} />
        <MiniStat label="Published" value={published} />
        <MiniStat label="Archived" value={websites.length - active.length} />
      </div>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <QuickActions />
      </section>

      {/* Continue working + right rail */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentWebsites websites={recent} now={now} />
        </div>
        <div className="space-y-6">
          <SoonPanel title="System health" icon={Gauge} emptyTitle="All systems operational" description="Live status and incidents will appear here." />
          <SoonPanel title="AI credits" icon={Zap} emptyTitle="Usage-based metering" description="AI generation credits arrive with the AI Generator." phase="7.2.4" />
        </div>
      </div>

      {/* Publishing rail (honest placeholders) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SoonPanel title="Recent deployments" icon={Rocket} emptyTitle="No deployments yet" description="Publish a website to see deployment history." phase="8" />
        <SoonPanel title="Recent AI generations" icon={Sparkles} emptyTitle="No generations yet" description="Generate content to see it here." phase="7.2.4" />
        <SoonPanel title="Domains" icon={Link2} emptyTitle="No domains connected" description="Connect a custom domain to a website." phase="8.5" />
      </div>

      {/* Activity + build queue */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SoonPanel title="Recent activity" icon={Activity} emptyTitle="No activity yet" description="Edits, generations, and deployments will show up here." />
        </div>
        <SoonPanel title="Build queue" icon={ListChecks} emptyTitle="Queue is empty" description="Generation and build jobs will appear here." phase="7.2.4" />
      </div>

      {/* What's new — real, not fabricated */}
      <Panel title="Latest updates" description="Recently shipped in your dashboard">
        <ul className="space-y-3 text-sm">
          {[
            ['Website Manager', 'Create, organize, and manage websites with a guided wizard.'],
            ['Command palette', 'Press ⌘K / Ctrl+K to jump anywhere.'],
            ['Dashboard shell', 'Responsive sidebar, org/workspace switching, dark mode.'],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <BarChart3 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="font-medium text-foreground">{title}</span>
                <span className="text-muted-fg"> — {body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
