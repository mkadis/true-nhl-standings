-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('REG', 'OT', 'SO');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "gameType" INTEGER NOT NULL,
    "gameDate" TIMESTAMP(3) NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_season_gameType_idx" ON "Game"("season", "gameType");

-- CreateIndex
CREATE INDEX "Game_gameDate_idx" ON "Game"("gameDate");
