import type { DiffRow, PlayoffStatus } from "@/lib/standings";
import { TEAMS } from "@/lib/teams";

const STATUS_LABEL: Record<NonNullable<PlayoffStatus>, string> = {
  division: "Top 3",
  wildcard: "Wild card",
};

// Ordering used to tell whether a status change is a step up or down.
const STATUS_ORDER: Record<NonNullable<PlayoffStatus>, number> = { division: 2, wildcard: 1 };

function statusLabel(status: PlayoffStatus): string {
  return status ? STATUS_LABEL[status] : "Out";
}

function statusRank(status: PlayoffStatus): number {
  return status ? STATUS_ORDER[status] : 0;
}

/** Playoff position under the Real system → under the True system. */
function PlayoffCell({ row }: { row: DiffRow }) {
  if (row.realPlayoff === row.truePlayoff) {
    return (
      <td className={row.truePlayoff ? "status-in" : "delta-flat"}>{statusLabel(row.truePlayoff)}</td>
    );
  }
  const improved = statusRank(row.truePlayoff) > statusRank(row.realPlayoff);
  return (
    <td className={improved ? "delta-up" : "delta-down"}>
      {statusLabel(row.realPlayoff)} → {statusLabel(row.truePlayoff)}
    </td>
  );
}

/** One division's placing-difference table: Real rank vs. True rank. */
export function DiffTable({ rows, caption }: { rows: DiffRow[]; caption: string }) {
  return (
    <div className="table-scroll">
      <table className="standings">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Team</th>
            <th>Real rank</th>
            <th>True rank</th>
            <th>Change</th>
            <th>Playoffs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const deltaClass =
              row.delta > 0 ? "delta-up" : row.delta < 0 ? "delta-down" : "delta-flat";
            const deltaLabel = row.delta === 0 ? "—" : row.delta > 0 ? `+${row.delta}` : `${row.delta}`;
            return (
              <tr key={row.triCode}>
                <td>
                  <span className="team-name">
                    <span
                      className="team-dot"
                      style={{ background: TEAMS[row.triCode]?.color ?? "#666" }}
                    />
                    <span className="team-full">{row.name}</span>
                  <span className="team-short">{row.triCode}</span>
                  </span>
                </td>
                <td>{row.realRank}</td>
                <td>{row.trueRank}</td>
                <td className={deltaClass}>{deltaLabel}</td>
                <PlayoffCell row={row} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
