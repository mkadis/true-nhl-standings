import { realPoints, truePoints } from "./points";
import { CONFERENCES, type Conference, type Division, type TeamInfo } from "./teams";

export type PointSystem = "true" | "real";

// The only fields standings math needs. Deliberately not the full Prisma
// Game type, so this same code works on data that's been serialized to
// plain JSON and sent to a client component (Date -> string, etc.).
export interface GameForStandings {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  periodType: "REG" | "OT" | "SO";
}

export interface TeamRow {
  triCode: string;
  name: string;
  conference: Conference;
  division: Division;
  gamesPlayed: number;
  regWins: number;
  otWins: number; // all extra-time wins (OT + SO) — what the table shows
  soWins: number; // the shootout subset of otWins; only used for tiebreaks
  otLosses: number;
  regLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number; // 1-indexed, league-wide
}

// How a team qualifies for the playoffs: top 3 in its division, or one of
// the two best remaining teams in its conference (wild card).
export type PlayoffStatus = "division" | "wildcard" | null;

export interface DivisionRow extends TeamRow {
  divisionRank: number;
  conferenceRank: number;
  playoff: PlayoffStatus;
}

export interface DivisionStandings<Row> {
  name: Division;
  rows: Row[];
}

export interface ConferenceStandings<Row> {
  name: Conference;
  divisions: DivisionStandings<Row>[];
}

function emptyRow(team: TeamInfo): Omit<TeamRow, "rank"> {
  return {
    triCode: team.triCode,
    name: team.name,
    conference: team.conference,
    division: team.division,
    gamesPlayed: 0,
    regWins: 0,
    otWins: 0,
    soWins: 0,
    otLosses: 0,
    regLosses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

/**
 * The NHL's standings tiebreakers, in order: points, fewer games played,
 * regulation wins, regulation + overtime wins (ROW — shootout wins don't
 * count), goal differential, goals for. The one official tiebreaker we skip
 * is head-to-head points between the tied clubs, which rarely decides
 * anything and would need every game re-scanned per tie.
 */
function compareRows(a: Omit<TeamRow, "rank">, b: Omit<TeamRow, "rank">): number {
  if (b.points !== a.points) return b.points - a.points;
  if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
  if (b.regWins !== a.regWins) return b.regWins - a.regWins;
  const rowA = a.regWins + a.otWins - a.soWins;
  const rowB = b.regWins + b.otWins - b.soWins;
  if (rowB !== rowA) return rowB - rowA;
  const diffA = a.goalsFor - a.goalsAgainst;
  const diffB = b.goalsFor - b.goalsAgainst;
  if (diffB !== diffA) return diffB - diffA;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.name.localeCompare(b.name);
}

/**
 * Computes a full league standings table for the given point system, from
 * raw finished games. Regular season only — filter games to gameType 2
 * before calling this if a season mixes in playoff games.
 *
 * `teams` is the set of clubs to list (see teamsForSeason) — every one gets
 * a row even with zero games, and any tri-code in the games that isn't in
 * the list is ignored, so a stray preseason/relocated code can't add a row.
 */
export function computeStandings(
  games: GameForStandings[],
  system: PointSystem,
  teams: TeamInfo[],
): TeamRow[] {
  const rows = new Map<string, Omit<TeamRow, "rank">>();

  for (const team of teams) {
    rows.set(team.triCode, emptyRow(team));
  }

  for (const game of games) {
    const homeRow = rows.get(game.homeTeam);
    const awayRow = rows.get(game.awayTeam);
    if (!homeRow || !awayRow) continue;

    const { home, away } = system === "true" ? truePoints(game) : realPoints(game);
    const homeWon = game.homeScore > game.awayScore;
    const winner = homeWon ? homeRow : awayRow;
    const loser = homeWon ? awayRow : homeRow;

    homeRow.gamesPlayed += 1;
    awayRow.gamesPlayed += 1;
    homeRow.goalsFor += game.homeScore;
    homeRow.goalsAgainst += game.awayScore;
    awayRow.goalsFor += game.awayScore;
    awayRow.goalsAgainst += game.homeScore;
    homeRow.points += home;
    awayRow.points += away;

    if (game.periodType === "REG") {
      winner.regWins += 1;
      loser.regLosses += 1;
    } else {
      winner.otWins += 1;
      if (game.periodType === "SO") winner.soWins += 1;
      loser.otLosses += 1;
    }
  }

  const sorted = Array.from(rows.values()).sort(compareRows);
  return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
}

/**
 * Splits a league-wide table into conferences and divisions (in display
 * order) and marks each team's playoff position: the top 3 in each division
 * qualify, then the next two best teams in each conference regardless of
 * division take the wild cards. Nothing is marked until at least one game
 * has been played — an all-zero table has no meaningful top 3.
 */
export function groupByDivision(rows: TeamRow[]): ConferenceStandings<DivisionRow>[] {
  const anyGames = rows.some((r) => r.gamesPlayed > 0);

  return CONFERENCES.map((conf) => {
    // `rows` is already sorted league-wide, so filtering preserves order.
    const confRows = rows.filter((r) => r.conference === conf.name);
    const conferenceRank = new Map(confRows.map((r, i) => [r.triCode, i + 1]));

    const playoff = new Map<string, PlayoffStatus>();
    for (const division of conf.divisions) {
      confRows
        .filter((r) => r.division === division)
        .slice(0, 3)
        .forEach((r) => playoff.set(r.triCode, "division"));
    }
    confRows
      .filter((r) => !playoff.has(r.triCode))
      .slice(0, 2)
      .forEach((r) => playoff.set(r.triCode, "wildcard"));

    return {
      name: conf.name,
      divisions: conf.divisions.map((division) => ({
        name: division,
        rows: confRows
          .filter((r) => r.division === division)
          .map((r, i) => ({
            ...r,
            divisionRank: i + 1,
            conferenceRank: conferenceRank.get(r.triCode) ?? 0,
            playoff: anyGames ? (playoff.get(r.triCode) ?? null) : null,
          })),
      })),
    };
  });
}

export interface DiffRow {
  triCode: string;
  name: string;
  trueRank: number; // within the division
  realRank: number; // within the division
  delta: number; // positive = moved up under the True system
  truePlayoff: PlayoffStatus;
  realPlayoff: PlayoffStatus;
}

/**
 * Builds the "difference in placing" view: for each division, each team's
 * True rank vs. Real rank, plus whether its playoff position changes.
 */
export function computeRankDiff(
  games: GameForStandings[],
  teams: TeamInfo[],
): ConferenceStandings<DiffRow>[] {
  const trueGrouped = groupByDivision(computeStandings(games, "true", teams));
  const realGrouped = groupByDivision(computeStandings(games, "real", teams));

  const realByTeam = new Map<string, DivisionRow>();
  for (const conf of realGrouped) {
    for (const div of conf.divisions) {
      for (const row of div.rows) realByTeam.set(row.triCode, row);
    }
  }

  return trueGrouped.map((conf) => ({
    name: conf.name,
    divisions: conf.divisions.map((div) => ({
      name: div.name,
      rows: div.rows.map((row) => {
        const real = realByTeam.get(row.triCode);
        const realRank = real?.divisionRank ?? row.divisionRank;
        return {
          triCode: row.triCode,
          name: row.name,
          trueRank: row.divisionRank,
          realRank,
          delta: realRank - row.divisionRank,
          truePlayoff: row.playoff,
          realPlayoff: real?.playoff ?? null,
        };
      }),
    })),
  }));
}
