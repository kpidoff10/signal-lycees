-- CreateEnum
CREATE TYPE "MobilizationOrigin" AS ENUM ('STUDENT', 'PRESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "MobilizationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');


-- CreateTable
CREATE TABLE "Mobilization" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "origin" "MobilizationOrigin" NOT NULL,
    "status" "MobilizationStatus" NOT NULL DEFAULT 'PENDING',
    "happenedOn" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reasons" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "importBatch" TEXT,
    "reporterId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mobilization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mobilization_status_expiresAt_idx" ON "Mobilization"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Mobilization_schoolId_status_idx" ON "Mobilization"("schoolId", "status");

-- AddForeignKey
ALTER TABLE "Mobilization" ADD CONSTRAINT "Mobilization_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

