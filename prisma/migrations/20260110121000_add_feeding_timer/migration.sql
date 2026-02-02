-- CreateTable
CREATE TABLE "FeedingTimer" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "activeBreast" TEXT,
    "leftDuration" INTEGER NOT NULL DEFAULT 0,
    "rightDuration" INTEGER NOT NULL DEFAULT 0,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT,
    "caretakerId" TEXT,

    CONSTRAINT "FeedingTimer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedingTimer_babyId_idx" ON "FeedingTimer"("babyId");
CREATE INDEX "FeedingTimer_familyId_idx" ON "FeedingTimer"("familyId");

-- AddForeignKey
ALTER TABLE "FeedingTimer" ADD CONSTRAINT "FeedingTimer_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedingTimer" ADD CONSTRAINT "FeedingTimer_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeedingTimer" ADD CONSTRAINT "FeedingTimer_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
