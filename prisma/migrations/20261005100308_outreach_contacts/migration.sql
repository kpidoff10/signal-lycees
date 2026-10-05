
-- CreateTable
CREATE TABLE "OutreachContact" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachVisit" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachContact_code_key" ON "OutreachContact"("code");

-- CreateIndex
CREATE INDEX "OutreachContact_campaign_idx" ON "OutreachContact"("campaign");

-- CreateIndex
CREATE INDEX "OutreachVisit_contactId_at_idx" ON "OutreachVisit"("contactId", "at");

-- AddForeignKey
ALTER TABLE "OutreachVisit" ADD CONSTRAINT "OutreachVisit_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "OutreachContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

