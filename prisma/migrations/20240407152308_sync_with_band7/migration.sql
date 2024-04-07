-- CreateTable
CREATE TABLE "BlackoutDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BlackoutDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandVenue" (
    "bandId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,

    PRIMARY KEY ("bandId", "venueId"),
    CONSTRAINT "BandVenue_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "venueId" TEXT,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandEvent" (
    "bandId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    PRIMARY KEY ("bandId", "eventId"),
    CONSTRAINT "BandEvent_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Band" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BandSong" (
    "bandId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,

    PRIMARY KEY ("bandId", "songId"),
    CONSTRAINT "BandSong_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "rating" INTEGER,
    "status" TEXT
);

-- CreateTable
CREATE TABLE "SongLyrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "songId" TEXT NOT NULL,
    CONSTRAINT "SongLyrics_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBand" (
    "userId" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("userId", "bandId"),
    CONSTRAINT "UserBand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBand_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandSetlist" (
    "bandId" TEXT NOT NULL,
    "setlistId" TEXT NOT NULL,
    "notes" TEXT,

    PRIMARY KEY ("bandId", "setlistId"),
    CONSTRAINT "BandSetlist_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandSetlist_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "Setlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "setlistId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Set_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "Setlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "SetSong_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SetSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Invitation_inviterId_idx" ON "Invitation"("inviterId");

-- CreateIndex
CREATE INDEX "Invitation_inviteeId_idx" ON "Invitation"("inviteeId");

-- CreateIndex
CREATE INDEX "Invitation_bandId_idx" ON "Invitation"("bandId");

-- CreateIndex
CREATE INDEX "Venue_id_idx" ON "Venue"("id");

-- CreateIndex
CREATE INDEX "Event_id_idx" ON "Event"("id");

-- CreateIndex
CREATE INDEX "Band_id_idx" ON "Band"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SongLyrics_songId_key" ON "SongLyrics"("songId");

-- CreateIndex
CREATE INDEX "SongLyrics_songId_idx" ON "SongLyrics"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "Setlist_eventId_key" ON "Setlist"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SetSong_setId_order_key" ON "SetSong"("setId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SetSong_setId_songId_key" ON "SetSong"("setId", "songId");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
