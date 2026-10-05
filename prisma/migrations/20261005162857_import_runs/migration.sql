-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('RESEARCH', 'PRESS', 'FILE');

-- CreateEnum
CREATE TYPE "ImportTrigger" AS ENUM ('AUTO', 'MANUAL', 'CLI');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('RUNNING', 'OK', 'ERROR');


-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "kind" "ImportKind" NOT NULL,
    "trigger" "ImportTrigger" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'RUNNING',
    "label" TEXT NOT NULL,
    "stats" JSONB,
    "details" JSONB,
    "error" TEXT,
    "adminId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportRun_startedAt_idx" ON "ImportRun"("startedAt");

-- CreateIndex
CREATE INDEX "ImportRun_kind_startedAt_idx" ON "ImportRun"("kind", "startedAt");

