-- CreateTable
CREATE TABLE "VenueContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "lastContacted" DATETIME,
    "status" TEXT,
    CONSTRAINT "VenueContact_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VenueContact_venueId_key" ON "VenueContact"("venueId");

-- CreateIndex
CREATE INDEX "VenueContact_venueId_idx" ON "VenueContact"("venueId");
