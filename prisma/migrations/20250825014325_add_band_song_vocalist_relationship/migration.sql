-- CreateTable
CREATE TABLE "BandSongVocalist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bandId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocalType" TEXT,
    "notes" TEXT,
    CONSTRAINT "BandSongVocalist_bandId_songId_fkey" FOREIGN KEY ("bandId", "songId") REFERENCES "BandSong" ("bandId", "songId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandSongVocalist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BandSongVocalist_bandId_songId_idx" ON "BandSongVocalist"("bandId", "songId");

-- CreateIndex
CREATE INDEX "BandSongVocalist_userId_idx" ON "BandSongVocalist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BandSongVocalist_bandId_songId_userId_vocalType_key" ON "BandSongVocalist"("bandId", "songId", "userId", "vocalType");
