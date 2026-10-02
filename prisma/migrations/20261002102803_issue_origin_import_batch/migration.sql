-- CreateEnum
CREATE TYPE "IssueOrigin" AS ENUM ('STUDENT', 'PRESS');


-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "importBatch" TEXT,
ADD COLUMN     "origin" "IssueOrigin" NOT NULL DEFAULT 'STUDENT';

-- CreateIndex
CREATE INDEX "Issue_origin_importBatch_idx" ON "Issue"("origin", "importBatch");

