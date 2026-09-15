export interface PointsAwarded {
  home: number;
  away: number;
}

interface GameOutcomeFields {
  homeScore: number;
  awayScore: number;
  periodType: "REG" | "OT" | "SO";
}

/**
 * The NHL's actual point system today:
 *   any win           -> 2 points
 *   OT/SO loss        -> 1 point
 *   regulation loss    -> 0 points
 * A regulation win and an OT/SO win are worth the same. This is what makes
 * "two losses" (an OT loss + nothing) worth as much as a chunk of a win, and
 * is the exact asymmetry this project exists to correct for.
 */
export function realPoints(game: GameOutcomeFields): PointsAwarded {
  const homeWon = game.homeScore > game.awayScore;
  const decidedInReg = game.periodType === "REG";

  if (decidedInReg) {
    return homeWon ? { home: 2, away: 0 } : { home: 0, away: 2 };
  }
  // OT or SO: winner gets 2, loser gets 1.
  return homeWon ? { home: 2, away: 1 } : { home: 1, away: 2 };
}

/**
 * True NHL Standings point system:
 *   regulation win  -> 3 points
 *   OT/SO win       -> 2 points
 *   OT/SO loss      -> 1 point
 *   regulation loss -> 0 points
 * A regulation win is worth meaningfully more than squeaking out extra time,
 * and two OT losses can never add up to more than one regulation win.
 */
export function truePoints(game: GameOutcomeFields): PointsAwarded {
  const homeWon = game.homeScore > game.awayScore;
  const decidedInReg = game.periodType === "REG";

  if (decidedInReg) {
    return homeWon ? { home: 3, away: 0 } : { home: 0, away: 3 };
  }
  return homeWon ? { home: 2, away: 1 } : { home: 1, away: 2 };
}
