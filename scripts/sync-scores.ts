// Pulls finished games from the NHL API and upserts them into our database.
//
// Usage: npm run sync
// Scheduled by .github/workflows/sync-scores.yml (a few times a day, more
// often in the evening window when games are ending).
//
// We look back a few days on every run, not just "today" — that makes the
// sync idempotent and self-healing: a late-finishing game, a temporary API
// hiccup, or a missed cron run all just get picked up on the next pass,
// because upserting an already-synced game is a safe no-op.

import { prisma } from "../lib/db";
import { fetchFinishedGamesForDate, toApiDateString } from "../lib/nhl-api";

const LOOKBACK_DAYS = 4;
const REGULAR_SEASON_GAME_TYPE = 2;

async function syncDate(dateStr: string) {
  const games = await fetchFinishedGamesForDate(dateStr);
  const regularSeasonGames = games.filter((g) => g.gameType === REGULAR_SEASON_GAME_TYPE);

  for (const game of regularSeasonGames) {
    await prisma.game.upsert({
      where: { id: game.id },
      create: game,
      update: game,
    });
  }

  return regularSeasonGames.length;
}

async function main() {
  const today = new Date();
  let totalSynced = 0;

  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    const dateStr = toApiDateString(date);

    try {
      const count = await syncDate(dateStr);
      console.log(`${dateStr}: synced ${count} finished game(s)`);
      totalSynced += count;
    } catch (err) {
      console.error(`${dateStr}: sync failed —`, err);
    }
  }

  console.log(`Done. ${totalSynced} game(s) synced across the last ${LOOKBACK_DAYS} days.`);
}

main()
  .catch((err) => {
    console.error("Sync script failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
