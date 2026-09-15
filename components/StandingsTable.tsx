import type { DivisionRow } from "@/lib/standings";
import { TEAMS } from "@/lib/teams";

const ROW_CLASS: Record<NonNullable<DivisionRow["playoff"]>, string> = {
  division: "playoff-division",
  wildcard: "playoff-wildcard",
};

/** One division's table. Rows are highlighted by playoff position. */
export function StandingsTable({ rows, caption }: { rows: DivisionRow[]; caption: string }) {
  return (
    <div className="table-scroll">
      <table className="standings standings-stats">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Team</th>
            <th>GP</th>
            <th>W</th>
            <th>OTW</th>
            <th>OTL</th>
            <th>L</th>
            <th className="col-optional">GF</th>
            <th className="col-optional">GA</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.triCode} className={row.playoff ? ROW_CLASS[row.playoff] : undefined}>
              <td>
                <span className="team-name">
                  <span className="rank">{row.divisionRank}</span>
                  <span
                    className="team-dot"
                    style={{ background: TEAMS[row.triCode]?.color ?? "#666" }}
                  />
                  <span className="team-full">{row.name}</span>
                  <span className="team-short">{row.triCode}</span>
                  {row.playoff === "wildcard" && (
                    <span className="tag tag-wildcard" title="Wild card">
                      WC
                    </span>
                  )}
                </span>
              </td>
              <td>{row.gamesPlayed}</td>
              <td>{row.regWins}</td>
              <td>{row.otWins}</td>
              <td>{row.otLosses}</td>
              <td>{row.regLosses}</td>
              <td className="col-optional">{row.goalsFor}</td>
              <td className="col-optional">{row.goalsAgainst}</td>
              <td className="points-col">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
