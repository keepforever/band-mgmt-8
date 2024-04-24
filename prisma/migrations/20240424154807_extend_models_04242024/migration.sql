-- AlterTable
ALTER TABLE "Song" ADD COLUMN "key" TEXT;

-- AlterTable
ALTER TABLE "UserBand" ADD COLUMN "instrument" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT,
    "venueId" TEXT,
    "setlistId" TEXT,
    "payment" INTEGER,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "Setlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("date", "id", "location", "name", "setlistId", "venueId") SELECT "date", "id", "location", "name", "setlistId", "venueId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_id_idx" ON "Event"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
