-- Phase 7.2.3 — Website Manager: extend the Website aggregate.
-- Additive only (safe on existing data; new columns have defaults or are nullable).

-- AlterTable
ALTER TABLE "Website" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE "Website" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "Website" ADD COLUMN "businessConfig" JSONB;
ALTER TABLE "Website" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Website_projectId_status_idx" ON "Website"("projectId", "status");
