-- CreateTable
CREATE TABLE "resolutions" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "resolutionDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "votingDetails" TEXT,
    "referenceNumber" TEXT,
    "attachments" TEXT[],
    "relatedPersonId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
