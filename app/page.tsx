import { StandingsPage } from "@/components/StandingsPage";
import { currentSeasonId } from "@/lib/seasons";

export const revalidate = 300; // re-render at most every 5 minutes

export default function HomePage() {
  return <StandingsPage seasonId={currentSeasonId()} />;
}
