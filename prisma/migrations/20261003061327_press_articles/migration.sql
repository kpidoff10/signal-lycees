-- CreateEnum
CREATE TYPE "PressStatus" AS ENUM ('PUBLISHED', 'PENDING', 'REJECTED');


-- CreateTable
CREATE TABLE "PressArticle" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "status" "PressStatus" NOT NULL DEFAULT 'PENDING',
    "feed" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION,
    "sensitive" DOUBLE PRECISION,
    "offTopic" DOUBLE PRECISION,
    "reason" TEXT,
    "schoolIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citySlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PressArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressArticle_url_key" ON "PressArticle"("url");

-- CreateIndex
CREATE INDEX "PressArticle_status_publishedAt_idx" ON "PressArticle"("status", "publishedAt");

