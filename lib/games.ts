import { prisma } from "./db";
import { currentSeasonId } from "./seasons";
import type { GameForStandings } from "./standings";

export const REGULAR_SEASON_GAME_TYPE = 2;

/** Every finished regular-season game we have for a season. */
export async function getGamesForSeason(seasonId: number): Promise<GameForStandings[]> {
  return prisma.game.findMany({
    where: { season: seasonId, gameType: REGULAR_SEASON_GAME_TYPE },
    select: {
      homeTeam: true,
      awayTeam: true,
      homeScore: true,
      awayScore: true,
      periodType: true,
    },
  });
}

/**
 * Seasons that can be picked from the dropdown: every season with at least
 * one game in the database, plus the current one (which is empty until
 * opening night). Newest first.
 */
export async function getAvailableSeasons(): Promise<number[]> {
  const stored = await prisma.game.findMany({
    distinct: ["season"],
    select: { season: true },
  });
  const ids = new Set(stored.map((s) => s.season));
  ids.add(currentSeasonId());
  return Array.from(ids).sort((a, b) => b - a);
}
