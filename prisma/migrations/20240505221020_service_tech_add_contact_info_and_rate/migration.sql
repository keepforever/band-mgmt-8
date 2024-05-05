-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tech" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "rate" INTEGER,
    "serviceTypeId" TEXT NOT NULL,
    CONSTRAINT "Tech_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tech" ("contactInfo", "id", "name", "serviceTypeId") SELECT "contactInfo", "id", "name", "serviceTypeId" FROM "Tech";
DROP TABLE "Tech";
ALTER TABLE "new_Tech" RENAME TO "Tech";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
