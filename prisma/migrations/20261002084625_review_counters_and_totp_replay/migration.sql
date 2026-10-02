
-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "totpLastStep" INTEGER;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "downCountAtReview" INTEGER NOT NULL DEFAULT 0;

