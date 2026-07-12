import type { Metadata } from 'next';
import { ListChecks } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { queueMonitoring } from '@/lib/jobs/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { QueueDashboard } from '@/components/jobs/QueueDashboard';

export const metadata: Metadata = { title: 'Task Center' };

/**
 * Task Center (Phase 9). A personal, workspace-scoped view of background work —
 * bulk generation/deployment and scheduled jobs. Reuses the Phase 8.5 queue
 * monitoring + dashboard component (no duplicate job system).
 */
export default async function TasksPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={ListChecks} title="No workspace selected" description="Select a workspace to view your tasks." />;
  }
  const mon = await queueMonitoring(ctx.currentWorkspace.id);
  const recent = mon.recent.map((j) => ({
    id: j.id, queue: j.queue, type: j.type, status: j.status,
    attempts: j.attempts, maxAttempts: j.maxAttempts, error: j.error, createdAt: j.createdAt,
  }));

  return (
    <PageContainer>
      <PageHeader title="Task Center" description="Track bulk generation, deployment, and scheduled background work." />
      <QueueDashboard queues={mon.queues} recent={recent} totals={mon.totals} workerConfigured={Boolean(process.env.JOBS_WORKER_TOKEN)} />
    </PageContainer>
  );
}
