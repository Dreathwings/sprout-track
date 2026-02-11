-- CreateTable
CREATE TABLE "FeedingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "side" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "FeedingSession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedingSession_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedingSession_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedingSession_babyId_status_key" ON "FeedingSession"("babyId", "status");

-- CreateIndex
CREATE INDEX "FeedingSession_familyId_idx" ON "FeedingSession"("familyId");

-- CreateIndex
CREATE INDEX "FeedingSession_status_idx" ON "FeedingSession"("status");

-- CreateIndex
CREATE INDEX "FeedingSession_startedAt_idx" ON "FeedingSession"("startedAt");
