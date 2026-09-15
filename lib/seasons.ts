// NHL season ids are the two calendar years concatenated: 2025-26 is
// 20252026. This is the same value the NHL API uses in `game.season`.

/** The season in progress (or, in the off-season, the one coming up). */
export function currentSeasonId(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  // The NHL season starts in October; treat July onward as the new season so
  // the summer shows the upcoming year rather than last year's final table.
  const startYear = now.getUTCMonth() >= 6 ? year : year - 1;
  return startYear * 10000 + (startYear + 1);
}

/** "20252026" -> 20252026, or null if it isn't a plausible season id. */
export function parseSeasonId(raw: string | undefined): number | null {
  if (!raw || !/^\d{8}$/.test(raw)) return null;
  const id = Number(raw);
  const start = Math.floor(id / 10000);
  const end = id % 10000;
  return end === start + 1 ? id : null;
}

/** 20252026 -> "2025–26" */
export function formatSeason(seasonId: number): string {
  const start = Math.floor(seasonId / 10000);
  const end = seasonId % 10000;
  return `${start}–${String(end).slice(2)}`;
}
