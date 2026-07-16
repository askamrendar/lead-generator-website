import Link from 'next/link';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listWorkspaceWebsites } from '@/lib/websites/service';
import { lifecycleBadge } from '@/lib/websites/status';
import { getAiCredentialInfo } from '@/lib/ai/credentials';
import { getAIConfig } from '@/lib/ai/config';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/websites/StatusBadge';

export const dynamic = 'force-dynamic';

/**
 * Workspace AI Generator hub — pick a website to generate (each website's own
 * AI Generator tab runs the async job), see the AI connection state, or connect
 * a provider. Generation itself lives per-website; this page is the launcher.
 */
export default async function AiGeneratorPage() {
  const ctx = await loadDashboardContext();
  const ws = ctx?.currentWorkspace;
  const websites = ws ? await listWorkspaceWebsites(ws.id) : [];
  const creds = ws ? await getAiCredentialInfo(ws.id) : null;
  const aiConnected = Boolean(creds?.configured) || getAIConfig().enabled;

  return (
    <PageContainer>
      <PageHeader
        title="AI Generator"
        description="Generate complete websites from their business configuration."
      />

      <Card className={aiConnected ? 'p-4' : 'border-brand/30 bg-brand/5 p-4'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-fg">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            {aiConnected ? (
              <span>
                <span className="font-medium text-foreground">AI connected</span>
                {creds?.provider ? <> via <code className="rounded bg-muted px-1">{creds.provider}</code></> : null}
                {' '}— generations produce unique copy (and a hero image on OpenAI/Gemini).
              </span>
            ) : (
              <span>
                <span className="font-medium text-foreground">No AI provider connected</span> — websites
                generate with built-in copy. Connect your API key for unique AI content and images.
              </span>
            )}
          </p>
          {!aiConnected && (
            <Button asChild size="sm" className="shrink-0">
              <Link href="/dashboard/settings/ai-providers">Connect AI provider</Link>
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Choose a website to generate</h2>
        {websites.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No websites yet"
            description="Create a website first — then generate it here."
            action={
              <Button asChild>
                <Link href="/dashboard/websites/new">
                  <Plus aria-hidden /> New website
                </Link>
              </Button>
            }
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {websites.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
                  <p className="truncate text-xs text-muted-fg">/{w.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge badge={lifecycleBadge(w)} />
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/websites/${w.id}/ai-generator`}>
                      {w.generatedAt ? 'Regenerate' : 'Generate'} <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
