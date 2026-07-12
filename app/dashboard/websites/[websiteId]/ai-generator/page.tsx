import { getWebsite } from '@/lib/websites/service';
import { jobsForWebsite } from '@/lib/jobs/service';
import { AiGenerator } from '@/components/websites/AiGenerator';

/**
 * Website AI Generator tab (Task 1). Wires the dashboard into the existing generation
 * engines via `lib/websites/generate-service` (run asynchronously through the Phase 8.5
 * queue). Read path is tenant-access-guarded by `getWebsite`.
 */
export default async function WebsiteAiGeneratorPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const website = await getWebsite(websiteId); // enforces access
  const jobRows = await jobsForWebsite(websiteId, 'website.generate');

  const jobs = jobRows.map((j) => ({
    id: j.id,
    status: j.status,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    error: j.error,
    createdAt: j.createdAt,
  }));

  return (
    <AiGenerator
      websiteId={websiteId}
      status={website.status}
      jobs={jobs}
      workerConfigured={Boolean(process.env.JOBS_WORKER_TOKEN)}
    />
  );
}
