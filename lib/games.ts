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

/**
 * When we last recorded a game result for a season — the newest `syncedAt`
 * of its games, or null if the season has no games yet.
 *
 * This is data freshness, not "when the sync last ran": if no games have
 * finished since the last run, the sync writes nothing and this stays put,
 * which is the honest thing to show a reader.
 */
export async function getLastUpdatedForSeason(seasonId: number): Promise<Date | null> {
  const result = await prisma.game.aggregate({
    where: { season: seasonId, gameType: REGULAR_SEASON_GAME_TYPE },
    _max: { syncedAt: true },
  });
  return result._max.syncedAt;
}
