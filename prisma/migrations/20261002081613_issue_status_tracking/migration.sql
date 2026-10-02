
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Issue_flaggedForReview_idx" ON "Issue"("flaggedForReview");

