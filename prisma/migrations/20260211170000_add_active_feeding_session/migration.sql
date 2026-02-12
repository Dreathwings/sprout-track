-- CreateEnum
CREATE TYPE "FeedingSessionStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "ActiveFeedingSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "activeSide" "BreastSide",
    "leftDurationMs" BIGINT NOT NULL DEFAULT 0,
    "rightDurationMs" BIGINT NOT NULL DEFAULT 0,
    "lastSwitchAt" TIMESTAMP(3),
    "status" "FeedingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "ActiveFeedingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveFeedingSession_babyId_familyId_key" ON "ActiveFeedingSession"("babyId", "familyId");
CREATE INDEX "ActiveFeedingSession_familyId_idx" ON "ActiveFeedingSession"("familyId");
CREATE INDEX "ActiveFeedingSession_status_idx" ON "ActiveFeedingSession"("status");

-- AddForeignKey
ALTER TABLE "ActiveFeedingSession" ADD CONSTRAINT "ActiveFeedingSession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActiveFeedingSession" ADD CONSTRAINT "ActiveFeedingSession_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActiveFeedingSession" ADD CONSTRAINT "ActiveFeedingSession_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
