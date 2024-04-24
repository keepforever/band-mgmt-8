-- AlterTable
ALTER TABLE "Event" ADD COLUMN "notes" TEXT;
ALTER TABLE "Event" ADD COLUMN "requiresPASystem" BOOLEAN;
ALTER TABLE "Event" ADD COLUMN "startEndTime" TEXT;

-- AlterTable
ALTER TABLE "Song" ADD COLUMN "capoPosition" INTEGER;
