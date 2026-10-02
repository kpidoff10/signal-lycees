-- Extensions : vecteurs (doublons), trigrammes et accents (recherche floue).
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('BUILDING', 'CATERING', 'CLASSES', 'ORGANIZATION', 'SECURITY', 'ACCESSIBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('ACTIVE', 'POSSIBLY_RESOLVED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'AUTO_APPROVED', 'MANUAL_REVIEW', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewPriority" AS ENUM ('NORMAL', 'ELEVATED', 'URGENT');

-- CreateEnum
CREATE TYPE "VoteValue" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "ContentReportReason" AS ENUM ('PERSON_TARGETED', 'PERSONAL_DATA', 'INSULT_HARASSMENT', 'FALSE_OR_DEFAMATORY', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "IssueEventType" AS ENUM ('CREATED', 'PUBLISHED', 'STATUS_CHANGED', 'CONFIRMATION_MILESTONE', 'STILL_PRESENT');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'MODERATOR');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "uai" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sector" TEXT,
    "address" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "academy" TEXT,
    "department" TEXT,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousIdentity" (
    "id" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorId" TEXT,
    "category" "IssueCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalTitle" TEXT,
    "originalDescription" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'ACTIVE',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewPriority" "ReviewPriority" NOT NULL DEFAULT 'NORMAL',
    "severity" "Severity",
    "upCount" INTEGER NOT NULL DEFAULT 0,
    "downCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedVoteCount" INTEGER NOT NULL DEFAULT 0,
    "trackingTokenHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalPurgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1024),

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueVote" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "value" "VoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueStatusVote" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueStatusVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "type" "IssueEventType" NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueDailyStat" (
    "issueId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "upTotal" INTEGER NOT NULL DEFAULT 0,
    "resolvedTotal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IssueDailyStat_pkey" PRIMARY KEY ("issueId","day")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "result" JSONB,
    "decision" "ModerationStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecret" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'MODERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "adminId" TEXT,
    "fromStatus" "ModerationStatus" NOT NULL,
    "toStatus" "ModerationStatus" NOT NULL,
    "publicReason" TEXT,
    "internalReason" TEXT,
    "editedTitle" TEXT,
    "editedDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "reason" "ContentReportReason" NOT NULL,
    "comment" TEXT,
    "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
    "reporterKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "issueId" TEXT,
    "message" TEXT NOT NULL,
    "contact" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_uai_key" ON "School"("uai");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "School_region_idx" ON "School"("region");

-- CreateIndex
CREATE INDEX "School_postalCode_idx" ON "School"("postalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_trackingTokenHash_key" ON "Issue"("trackingTokenHash");

-- CreateIndex
CREATE INDEX "Issue_schoolId_moderationStatus_status_idx" ON "Issue"("schoolId", "moderationStatus", "status");

-- CreateIndex
CREATE INDEX "Issue_moderationStatus_reviewPriority_createdAt_idx" ON "Issue"("moderationStatus", "reviewPriority", "createdAt");

-- CreateIndex
CREATE INDEX "Issue_category_idx" ON "Issue"("category");

-- CreateIndex
CREATE INDEX "Issue_lastActivityAt_idx" ON "Issue"("lastActivityAt");

-- CreateIndex
CREATE INDEX "IssueVote_issueId_value_updatedAt_idx" ON "IssueVote"("issueId", "value", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IssueVote_issueId_identityId_key" ON "IssueVote"("issueId", "identityId");

-- CreateIndex
CREATE INDEX "IssueStatusVote_issueId_createdAt_idx" ON "IssueStatusVote"("issueId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IssueStatusVote_issueId_identityId_key" ON "IssueStatusVote"("issueId", "identityId");

-- CreateIndex
CREATE INDEX "IssueEvent_issueId_createdAt_idx" ON "IssueEvent"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAnalysis_issueId_idx" ON "AIAnalysis"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "ModerationDecision_issueId_createdAt_idx" ON "ModerationDecision"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentReport_issueId_reporterKey_key" ON "ContentReport"("issueId", "reporterKey");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_targetType_targetId_idx" ON "AdminLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AnonymousIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueVote" ADD CONSTRAINT "IssueVote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueVote" ADD CONSTRAINT "IssueVote_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AnonymousIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStatusVote" ADD CONSTRAINT "IssueStatusVote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStatusVote" ADD CONSTRAINT "IssueStatusVote_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AnonymousIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEvent" ADD CONSTRAINT "IssueEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDailyStat" ADD CONSTRAINT "IssueDailyStat_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recherche floue des lycées (nom, ville, code postal normalisés).
CREATE INDEX "School_searchText_trgm_idx" ON "School" USING gin ("searchText" gin_trgm_ops);

-- Recherche de doublons par similarité cosinus.
CREATE INDEX "Issue_embedding_hnsw_idx" ON "Issue" USING hnsw ("embedding" vector_cosine_ops);

-- Repli textuel de la détection de doublons.
CREATE INDEX "Issue_title_trgm_idx" ON "Issue" USING gin ("title" gin_trgm_ops);
