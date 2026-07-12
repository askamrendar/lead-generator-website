import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { listPrompts, listAiRuns } from '@/lib/prompts/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { PromptLibrary } from '@/components/productivity/PromptLibrary';

export const metadata: Metadata = { title: 'AI Prompt Library' };

export default async function PromptsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <EmptyState icon={Sparkles} title="Sign in required" description="Sign in to manage your prompt library." />;
  }
  const [prompts, runs] = await Promise.all([listPrompts(), listAiRuns(20)]);

  return (
    <PageContainer>
      <PageHeader title="AI Prompt Library" description="Reusable prompt templates and your AI generation history." />
      <PromptLibrary prompts={prompts} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">AI history</h2>
        {runs.length === 0 ? (
          <EmptyState icon={Sparkles} title="No AI runs yet" description="Your AI generations will be listed here." />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {runs.map((r) => (
              <div key={r.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-fg">{r.kind}</span>
                  <p className="truncate text-sm text-foreground">{r.prompt}</p>
                </div>
                {r.output && <p className="mt-1 line-clamp-2 text-xs text-muted-fg">{r.output}</p>}
              </div>
            ))}
          </Card>
        )}
      </section>
    </PageContainer>
  );
}
