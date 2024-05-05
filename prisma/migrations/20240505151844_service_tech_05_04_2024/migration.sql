-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Tech" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    CONSTRAINT "Tech_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventTech" (
    "eventId" TEXT NOT NULL,
    "techId" TEXT NOT NULL,

    PRIMARY KEY ("eventId", "techId"),
    CONSTRAINT "EventTech_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventTech_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Tech" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandTech" (
    "bandId" TEXT NOT NULL,
    "techId" TEXT NOT NULL,

    PRIMARY KEY ("bandId", "techId"),
    CONSTRAINT "BandTech_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BandTech_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Tech" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
