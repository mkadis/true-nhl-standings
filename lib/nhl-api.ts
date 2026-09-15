// Client for the NHL's public web API (api-web.nhle.com).
//
// This is the same API nhl.com's own frontend uses. It's unofficial in the
// sense that the NHL doesn't publish formal docs for it, but it's free, has
// no API key, and is widely relied on. Reference:
// https://github.com/Zmalski/NHL-API-Reference
//
// Two endpoints, both returning games in the same shape:
//   /v1/score/{date} — every game on a date; used by the nightly sync.
//   /v1/club-schedule-season/{team}/{season} — one team's full season
//     (82 regular-season games, plus preseason/playoffs); used to backfill
//     a whole past season in 32 requests instead of ~200 per-day ones.
// Each game carries enough detail to tell us whether it was decided in
// regulation, overtime, or a shootout.

const NHL_API_BASE = "https://api-web.nhle.com/v1";

interface NhlTeamSide {
  abbrev: string;
  score?: number;
}

interface NhlPeriodDescriptor {
  periodType?: "REG" | "OT" | "SO";
}

interface NhlGameOutcome {
  lastPeriodType?: "REG" | "OT" | "SO";
}

interface NhlScoreGame {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  gameState: string; // "FUT" | "LIVE" | "CRIT" | "FINAL" | "OFF"
  startTimeUTC: string;
  homeTeam: NhlTeamSide;
  awayTeam: NhlTeamSide;
  periodDescriptor?: NhlPeriodDescriptor;
  gameOutcome?: NhlGameOutcome;
}

interface NhlGamesResponse {
  games: NhlScoreGame[];
}

// Games in these states are officially final. "CRIT"/"LIVE" games are still
// in progress and should be skipped until they finish.
const FINAL_STATES = new Set(["OFF", "FINAL"]);

export interface NormalizedGame {
  id: string;
  season: number;
  gameType: number;
  gameDate: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  periodType: "REG" | "OT" | "SO";
}

async function fetchFinishedGames(path: string): Promise<NormalizedGame[]> {
  const res = await fetch(`${NHL_API_BASE}${path}`, {
    // Scores don't need to be cached across requests during a sync run.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`NHL API request failed for ${path}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as NhlGamesResponse;

  return data.games
    .filter((g) => FINAL_STATES.has(g.gameState))
    .filter((g) => typeof g.homeTeam.score === "number" && typeof g.awayTeam.score === "number")
    .map((g) => {
      const periodType = g.gameOutcome?.lastPeriodType ?? g.periodDescriptor?.periodType ?? "REG";
      return {
        id: String(g.id),
        season: g.season,
        gameType: g.gameType,
        gameDate: new Date(g.startTimeUTC ?? g.gameDate),
        homeTeam: g.homeTeam.abbrev,
        awayTeam: g.awayTeam.abbrev,
        homeScore: g.homeTeam.score as number,
        awayScore: g.awayTeam.score as number,
        periodType,
      };
    });
}

/**
 * Fetches and normalizes all *finished* games for a given date.
 * @param date format "YYYY-MM-DD"
 */
export function fetchFinishedGamesForDate(date: string): Promise<NormalizedGame[]> {
  return fetchFinishedGames(`/score/${date}`);
}

/**
 * Fetches and normalizes every *finished* game one team played in a season
 * (all game types — filter to gameType 2 for regular season).
 * @param triCode e.g. "TOR"
 * @param seasonId e.g. 20252026
 */
export function fetchFinishedGamesForTeamSeason(
  triCode: string,
  seasonId: number,
): Promise<NormalizedGame[]> {
  return fetchFinishedGames(`/club-schedule-season/${triCode}/${seasonId}`);
}

/** YYYY-MM-DD for a Date, in UTC (matches how the NHL API keys dates). */
export function toApiDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}
