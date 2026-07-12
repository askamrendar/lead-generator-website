-- Phase 9 — Single-User Productivity. Additive (Website columns + 3 models + enum value).
ALTER TYPE "WebsiteStatus" ADD VALUE IF NOT EXISTS 'TRASHED';

ALTER TABLE "Website" ADD COLUMN "trashedAt" TIMESTAMP(3);
ALTER TABLE "Website" ADD COLUMN "pinnedAt" TIMESTAMP(3);
ALTER TABLE "Website" ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Website" ADD COLUMN "lastOpenedAt" TIMESTAMP(3);
ALTER TABLE "Website" ADD COLUMN "revisions" JSONB;
CREATE INDEX "Website_projectId_pinnedAt_idx" ON "Website"("projectId", "pinnedAt");

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Prompt_userId_updatedAt_idx" ON "Prompt"("userId", "updatedAt");
CREATE INDEX "Prompt_userId_favorite_idx" ON "Prompt"("userId", "favorite");
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "output" TEXT,
    "websiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiRun_userId_createdAt_idx" ON "AiRun"("userId", "createdAt");
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
