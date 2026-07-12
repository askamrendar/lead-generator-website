-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "websiteId" TEXT;

-- CreateIndex
CREATE INDEX "Job_websiteId_createdAt_idx" ON "Job"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_status_startedAt_idx" ON "Job"("status", "startedAt");
