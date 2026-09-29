import Image from "next/image";
import { LastUpdated } from "@/components/LastUpdated";
import { StandingsView } from "@/components/StandingsView";
import type { SeasonOption } from "@/components/SeasonSelect";
import { getAvailableSeasons, getGamesForSeason, getLastUpdatedForSeason } from "@/lib/games";
import { currentSeasonId, formatSeason } from "@/lib/seasons";
import { computeRankDiff, computeStandings, groupByDivision } from "@/lib/standings";
import { teamsForSeason } from "@/lib/teams";

interface Props {
  seasonId: number;
  embed?: boolean;
}

// Server component shared by every route: loads one season's games plus the
// list of seasons for the dropdown, and renders the page shell. The embed
// variant drops the explanatory prose so it fits in a sidebar.
export async function StandingsPage({ seasonId, embed = false }: Props) {
  const current = currentSeasonId();
  const [games, seasons, lastUpdated] = await Promise.all([
    getGamesForSeason(seasonId),
    getAvailableSeasons(),
    // Only meaningful for the season in progress: for a finished season the
    // timestamp is just when it happened to get backfilled.
    seasonId === current ? getLastUpdatedForSeason(seasonId) : Promise.resolve(null),
  ]);

  // A season URL we don't have data for still gets listed, so the dropdown
  // always shows what the page is displaying.
  if (!seasons.includes(seasonId)) seasons.push(seasonId);
  seasons.sort((a, b) => b - a);

  const base = embed ? "/embed" : "";
  const seasonOptions: SeasonOption[] = seasons.map((id) => ({
    id,
    label: id === current ? `${formatSeason(id)} (current)` : formatSeason(id),
    href: id === current ? base || "/" : `${base}/season/${id}`,
  }));

  const teams = teamsForSeason(seasonId);
  const trueStandings = groupByDivision(computeStandings(games, "true", teams));
  const realStandings = groupByDivision(computeStandings(games, "real", teams));
  const diffStandings = computeRankDiff(games, teams);

  const seasonMeta =
    games.length === 0
      ? `${formatSeason(seasonId)} season · no games yet`
      : `${formatSeason(seasonId)} season · ${games.length.toLocaleString()} games`;

  return (
    <div className={embed ? "embed" : undefined}>
      <div className="page">
        <header className="masthead">
          {embed ? (
            <h1>
              True NHL Standings ·{" "}
              <a href="https://truenhlstandings.com" style={{ fontSize: "0.6em", color: "var(--muted)" }}>
                truenhlstandings.com
              </a>
            </h1>
          ) : (
            <>
              <h1 className="wordmark">
                <Image
                  src="/true-nhl-standings-logo.png"
                  alt=""
                  width={320}
                  height={125}
                  priority
                />
                True NHL Standings
              </h1>
              <p>
                True NHL Standings awards <strong>3 points</strong> for a regulation
                win, <strong>2 points</strong> for an overtime or shootout win,{" "}
                <strong>1 point</strong> for an overtime or shootout loss, and nothing
                for a regulation loss. We believe teams should be rewarded for
                winning in regulation: regulation wins count for more than overtime
                wins, and overtime wins count for more than overtime losses. This is
                the system the PWHL uses today and the KHL once did — it's just
                better for hockey.
              </p>
            </>
          )}
          <p className="season-meta">
            {seasonMeta}
            {lastUpdated && (
              <>
                {" · "}Updated <LastUpdated iso={lastUpdated.toISOString()} />
              </>
            )}
          </p>
        </header>

        <StandingsView
          trueStandings={trueStandings}
          realStandings={realStandings}
          diffStandings={diffStandings}
          gamesPlayed={games.length}
          seasonId={seasonId}
          seasonOptions={seasonOptions}
        />

        {!embed && (
          <footer className="footer-note">
            <p>
              Game data from the NHL. Standings are recomputed from every final
              score of the season, not adjusted from the NHL's own standings — so
              the "Real" view here should match nhl.com, and the "True" view shows
              what the table looks like under a stricter point system.
            </p>
            <p>
              Questions, corrections, collaborations, or sponsorship inquiries:{" "}
              <a href="mailto:info@truenhlstandings.com">info@truenhlstandings.com</a>
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
