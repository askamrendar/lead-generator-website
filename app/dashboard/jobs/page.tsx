import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { queueMonitoring } from '@/lib/jobs/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { QueueDashboard } from '@/components/jobs/QueueDashboard';

export const metadata: Metadata = { title: 'Background Jobs' };

export default async function JobsPage() {
  const ctx = await loadDashboardContext();
  if (!ctx?.currentWorkspace) {
    return <EmptyState icon={Activity} title="No workspace selected" description="Select a workspace to view background jobs." />;
  }
  const mon = await queueMonitoring(ctx.currentWorkspace.id);
  const recent = mon.recent.map((j) => ({
    id: j.id,
    queue: j.queue,
    type: j.type,
    status: j.status,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    error: j.error,
    createdAt: j.createdAt,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Background Jobs"
        description="Durable job queues, worker health, scheduling, and job history."
      />
      <QueueDashboard
        queues={mon.queues}
        recent={recent}
        totals={mon.totals}
        workerConfigured={Boolean(process.env.JOBS_WORKER_TOKEN)}
      />
    </PageContainer>
  );
}
