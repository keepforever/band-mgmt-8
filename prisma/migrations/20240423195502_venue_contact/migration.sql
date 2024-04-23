-- CreateTable
CREATE TABLE "VenueContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN,
    "status" TEXT,
    "venueId" TEXT NOT NULL,
    CONSTRAINT "VenueContact_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VenueContact_venueId_key" ON "VenueContact"("venueId");

-- CreateIndex
CREATE INDEX "VenueContact_venueId_idx" ON "VenueContact"("venueId");
