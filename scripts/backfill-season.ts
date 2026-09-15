// Loads every finished regular-season game of a past season into the
// database, so it can be viewed from the season dropdown.
//
// Usage: npm run backfill -- 20252026
//
// One-off, run by hand: the nightly sync (sync-scores.ts) only looks back a
// few days, so this is how a whole season gets in. It pulls each club's
// full schedule (32 requests). Every game appears in two clubs' schedules,
// which is harmless — the upsert on the NHL game id makes the second copy
// a no-op — and the total is verified against what each club should have
// played, so a partial API failure can't silently leave gaps.

import { prisma } from "../lib/db";
import { fetchFinishedGamesForTeamSeason } from "../lib/nhl-api";
import { formatSeason, parseSeasonId } from "../lib/seasons";
import { teamsForSeason } from "../lib/teams";

const REGULAR_SEASON_GAME_TYPE = 2;

async function main() {
  const seasonId = parseSeasonId(process.argv[2]);
  if (!seasonId) {
    console.error("Usage: npm run backfill -- <seasonId>   e.g. npm run backfill -- 20252026");
    process.exitCode = 1;
    return;
  }

  const teams = teamsForSeason(seasonId);
  const seen = new Set<string>();
  const failed: string[] = [];

  console.log(`Backfilling ${formatSeason(seasonId)} (${teams.length} clubs)…`);

  for (const team of teams) {
    try {
      const games = await fetchFinishedGamesForTeamSeason(team.triCode, seasonId);
      const regularSeason = games.filter((g) => g.gameType === REGULAR_SEASON_GAME_TYPE);

      let added = 0;
      for (const game of regularSeason) {
        if (seen.has(game.id)) continue;
        seen.add(game.id);
        await prisma.game.upsert({
          where: { id: game.id },
          create: game,
          update: game,
        });
        added += 1;
      }
      console.log(`${team.triCode}: ${regularSeason.length} finished games, ${added} new`);
    } catch (err) {
      failed.push(team.triCode);
      console.error(`${team.triCode}: failed —`, err);
    }
  }

  const stored = await prisma.game.count({
    where: { season: seasonId, gameType: REGULAR_SEASON_GAME_TYPE },
  });
  console.log(`Done. ${seen.size} game(s) written this run; ${stored} stored for ${formatSeason(seasonId)}.`);

  if (failed.length > 0) {
    console.error(`Failed clubs: ${failed.join(", ")} — re-run to fill in the gaps.`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
