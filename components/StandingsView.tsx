"use client";

import { useEffect, useState } from "react";
import type { ConferenceStandings, DiffRow, DivisionRow } from "@/lib/standings";
import { StandingsTable } from "./StandingsTable";
import { DiffTable } from "./DiffTable";
import { SeasonSelect, type SeasonOption } from "./SeasonSelect";

type View = "true" | "real" | "diff";

const VIEWS: View[] = ["true", "real", "diff"];

function isView(value: string): value is View {
  return (VIEWS as string[]).includes(value);
}

const VIEW_LABELS: Record<View, string> = {
  true: "True Standings",
  real: "Real (NHL) Standings",
  diff: "Difference",
};

const SYSTEM_NOTES: Record<View, string> = {
  true: "3 pts regulation win · 2 pts OT/SO win · 1 pt OT/SO loss · 0 pts regulation loss.",
  real: "The NHL's actual system: 2 pts for any win · 1 pt OT/SO loss · 0 pts regulation loss.",
  diff: "How many spots each team moves within its division between the two systems, and whether its playoff position changes. Positive means the True system ranks them higher.",
};

// All three tables are computed on the server (see StandingsPage) and
// passed in ready to render — the browser only needs to switch between them,
// not receive a whole season of raw games.
export interface Props {
  trueStandings: ConferenceStandings<DivisionRow>[];
  realStandings: ConferenceStandings<DivisionRow>[];
  diffStandings: ConferenceStandings<DiffRow>[];
  gamesPlayed: number;
  seasonId: number;
  seasonOptions: SeasonOption[];
}

/** Walks conference → division and renders one table per division. */
function Conferences<Row>({
  standings,
  renderTable,
}: {
  standings: ConferenceStandings<Row>[];
  renderTable: (rows: Row[], caption: string) => React.ReactNode;
}) {
  return (
    <>
      {standings.map((conf) => (
        <section key={conf.name} className="conference">
          <h2>{conf.name} Conference</h2>
          {conf.divisions.map((div) => (
            <div key={div.name}>{renderTable(div.rows, div.name)}</div>
          ))}
        </section>
      ))}
    </>
  );
}

export function StandingsView({
  trueStandings,
  realStandings,
  diffStandings,
  gamesPlayed,
  seasonId,
  seasonOptions,
}: Props) {
  const [view, setView] = useState<View>("true");

  // The view lives in the URL hash (#real, #diff) so a specific table can be
  // linked to. Read it after mount — the server always renders "true".
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (isView(fromHash)) setView(fromHash);
  }, []);

  function selectView(next: View) {
    setView(next);
    history.replaceState(null, "", next === "true" ? window.location.pathname : `#${next}`);
  }

  return (
    <div>
      <div className="controls">
        <div className="toggle" role="tablist" aria-label="Standings view">
          {VIEWS.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              data-active={view === v}
              onClick={() => selectView(v)}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <SeasonSelect options={seasonOptions} currentId={seasonId} />
      </div>

      <p className="system-note">{SYSTEM_NOTES[view]}</p>

      {gamesPlayed === 0 ? (
        <p className="empty-note">No games recorded for this season yet.</p>
      ) : (
        <ul className="legend" aria-label="Playoff key">
          <li>
            <span className="swatch swatch-division" /> Playoff spot — top 3 in division
          </li>
          <li>
            <span className="swatch swatch-wildcard" /> Wild card — next 2 in conference
          </li>
        </ul>
      )}

      {view === "true" && (
        <Conferences
          standings={trueStandings}
          renderTable={(rows, caption) => <StandingsTable rows={rows} caption={caption} />}
        />
      )}
      {view === "real" && (
        <Conferences
          standings={realStandings}
          renderTable={(rows, caption) => <StandingsTable rows={rows} caption={caption} />}
        />
      )}
      {view === "diff" && (
        <Conferences
          standings={diffStandings}
          renderTable={(rows, caption) => <DiffTable rows={rows} caption={caption} />}
        />
      )}
    </div>
  );
}
