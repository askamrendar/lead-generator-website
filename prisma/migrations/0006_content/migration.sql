-- Phase 8.3 — AI Blog Generator (ContentItem). Additive.
CREATE TYPE "ContentType" AS ENUM ('SERVICE','CITY','AREA','NEIGHBORHOOD','LOCATION','FAQ','COMPARISON','EDUCATIONAL','RESOURCE','CASE_STUDY','PRESS_RELEASE','LANDING','SUPPORTING','ARTICLE');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED');

CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'ARTICLE',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "body" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT,
    "seo" JSONB,
    "featuredImageId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "readingTimeMin" INTEGER NOT NULL DEFAULT 0,
    "revisions" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentItem_websiteId_slug_key" ON "ContentItem"("websiteId", "slug");
CREATE INDEX "ContentItem_websiteId_status_idx" ON "ContentItem"("websiteId", "status");
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
