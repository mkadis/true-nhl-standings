export type Conference = "Eastern" | "Western";
export type Division =
  | "Atlantic"
  | "Metropolitan"
  | "Central"
  | "Pacific";

export interface TeamInfo {
  triCode: string;
  name: string;
  conference: Conference;
  division: Division;
  color: string; // primary brand color, used for small accents in the UI
  // Season ids (e.g. 20242025) bounding when this team existed under this
  // tri-code. Omitted = no bound. Lets historical seasons show the teams
  // that actually played in them (Arizona in 2023-24, Utah from 2024-25).
  firstSeason?: number;
  lastSeason?: number;
}

// Display order on the page: East first, then West; within each conference,
// the divisions in the order the user reads them on nhl.com.
export const CONFERENCES: { name: Conference; divisions: Division[] }[] = [
  { name: "Eastern", divisions: ["Atlantic", "Metropolitan"] },
  { name: "Western", divisions: ["Central", "Pacific"] },
];

// Tri-codes match what the NHL API returns in score/schedule payloads
// (game.homeTeam.abbrev / game.awayTeam.abbrev).
//
// Divisions reflect the alignment in place since 2021-22. The 2020-21
// season used temporary one-off divisions (North/East/Central/West), so
// that season would need its own map if it were ever backfilled.
export const TEAMS: Record<string, TeamInfo> = {
  BOS: { triCode: "BOS", name: "Boston Bruins", conference: "Eastern", division: "Atlantic", color: "#FFB81C" },
  BUF: { triCode: "BUF", name: "Buffalo Sabres", conference: "Eastern", division: "Atlantic", color: "#002654" },
  DET: { triCode: "DET", name: "Detroit Red Wings", conference: "Eastern", division: "Atlantic", color: "#CE1126" },
  FLA: { triCode: "FLA", name: "Florida Panthers", conference: "Eastern", division: "Atlantic", color: "#C8102E" },
  MTL: { triCode: "MTL", name: "Montreal Canadiens", conference: "Eastern", division: "Atlantic", color: "#AF1E2D" },
  OTT: { triCode: "OTT", name: "Ottawa Senators", conference: "Eastern", division: "Atlantic", color: "#C52032" },
  TBL: { triCode: "TBL", name: "Tampa Bay Lightning", conference: "Eastern", division: "Atlantic", color: "#002868" },
  TOR: { triCode: "TOR", name: "Toronto Maple Leafs", conference: "Eastern", division: "Atlantic", color: "#00205B" },

  CAR: { triCode: "CAR", name: "Carolina Hurricanes", conference: "Eastern", division: "Metropolitan", color: "#CC0000" },
  CBJ: { triCode: "CBJ", name: "Columbus Blue Jackets", conference: "Eastern", division: "Metropolitan", color: "#002654" },
  NJD: { triCode: "NJD", name: "New Jersey Devils", conference: "Eastern", division: "Metropolitan", color: "#CE1126" },
  NYI: { triCode: "NYI", name: "New York Islanders", conference: "Eastern", division: "Metropolitan", color: "#00539B" },
  NYR: { triCode: "NYR", name: "New York Rangers", conference: "Eastern", division: "Metropolitan", color: "#0038A8" },
  PHI: { triCode: "PHI", name: "Philadelphia Flyers", conference: "Eastern", division: "Metropolitan", color: "#F74902" },
  PIT: { triCode: "PIT", name: "Pittsburgh Penguins", conference: "Eastern", division: "Metropolitan", color: "#FCB514" },
  WSH: { triCode: "WSH", name: "Washington Capitals", conference: "Eastern", division: "Metropolitan", color: "#C8102E" },

  ARI: { triCode: "ARI", name: "Arizona Coyotes", conference: "Western", division: "Central", color: "#8C2633", lastSeason: 20232024 },
  CHI: { triCode: "CHI", name: "Chicago Blackhawks", conference: "Western", division: "Central", color: "#CF0A2C" },
  COL: { triCode: "COL", name: "Colorado Avalanche", conference: "Western", division: "Central", color: "#6F263D" },
  DAL: { triCode: "DAL", name: "Dallas Stars", conference: "Western", division: "Central", color: "#006847" },
  MIN: { triCode: "MIN", name: "Minnesota Wild", conference: "Western", division: "Central", color: "#154734" },
  NSH: { triCode: "NSH", name: "Nashville Predators", conference: "Western", division: "Central", color: "#FFB81C" },
  STL: { triCode: "STL", name: "St. Louis Blues", conference: "Western", division: "Central", color: "#002F87" },
  UTA: { triCode: "UTA", name: "Utah Mammoth", conference: "Western", division: "Central", color: "#71AFE5", firstSeason: 20242025 },
  WPG: { triCode: "WPG", name: "Winnipeg Jets", conference: "Western", division: "Central", color: "#041E42" },

  ANA: { triCode: "ANA", name: "Anaheim Ducks", conference: "Western", division: "Pacific", color: "#F47A38" },
  CGY: { triCode: "CGY", name: "Calgary Flames", conference: "Western", division: "Pacific", color: "#C8102E" },
  EDM: { triCode: "EDM", name: "Edmonton Oilers", conference: "Western", division: "Pacific", color: "#FF4C00" },
  LAK: { triCode: "LAK", name: "Los Angeles Kings", conference: "Western", division: "Pacific", color: "#111111" },
  SJS: { triCode: "SJS", name: "San Jose Sharks", conference: "Western", division: "Pacific", color: "#006D75" },
  SEA: { triCode: "SEA", name: "Seattle Kraken", conference: "Western", division: "Pacific", color: "#99D9D9", firstSeason: 20212022 },
  VAN: { triCode: "VAN", name: "Vancouver Canucks", conference: "Western", division: "Pacific", color: "#00205B" },
  VGK: { triCode: "VGK", name: "Vegas Golden Knights", conference: "Western", division: "Pacific", color: "#B4975A", firstSeason: 20172018 },
};

export function teamName(triCode: string): string {
  return TEAMS[triCode]?.name ?? triCode;
}

/** The teams that played in a given season (by id, e.g. 20252026). */
export function teamsForSeason(seasonId: number): TeamInfo[] {
  return Object.values(TEAMS).filter(
    (t) =>
      (t.firstSeason === undefined || seasonId >= t.firstSeason) &&
      (t.lastSeason === undefined || seasonId <= t.lastSeason),
  );
}
