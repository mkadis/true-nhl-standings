import { StandingsPage } from "@/components/StandingsPage";
import { currentSeasonId } from "@/lib/seasons";

export const revalidate = 300;

// Intentionally minimal: no nav, no long explanation — just the toggles and
// the tables, sized to sit in a sidebar or a content column. Sites embed
// this at /embed inside an <iframe>.
export default function EmbedPage() {
  return <StandingsPage seasonId={currentSeasonId()} embed />;
}
