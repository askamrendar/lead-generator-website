-- Phase 8.0 — Deployment Engine. Additive.
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'ERROR', 'CANCELLED', 'ROLLED_BACK');

ALTER TABLE "Website" ADD COLUMN "deploymentConfig" JSONB;

CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "url" TEXT,
    "commitRef" TEXT,
    "error" TEXT,
    "logs" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Deployment_websiteId_createdAt_idx" ON "Deployment"("websiteId", "createdAt");
CREATE INDEX "Deployment_websiteId_status_idx" ON "Deployment"("websiteId", "status");
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
