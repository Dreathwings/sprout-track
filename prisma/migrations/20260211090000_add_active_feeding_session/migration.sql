-- CreateTable
CREATE TABLE "ActiveFeedingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL,
    "currentSide" TEXT NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "accumulatedDurationLeft" INTEGER NOT NULL DEFAULT 0,
    "accumulatedDurationRight" INTEGER NOT NULL DEFAULT 0,
    "lastResumedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "ActiveFeedingSession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActiveFeedingSession_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActiveFeedingSession_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveFeedingSession_babyId_key" ON "ActiveFeedingSession"("babyId");
CREATE INDEX "ActiveFeedingSession_familyId_idx" ON "ActiveFeedingSession"("familyId");
CREATE INDEX "ActiveFeedingSession_caretakerId_idx" ON "ActiveFeedingSession"("caretakerId");
