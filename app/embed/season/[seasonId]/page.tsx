import { notFound } from "next/navigation";
import { StandingsPage } from "@/components/StandingsPage";
import { parseSeasonId } from "@/lib/seasons";

export const revalidate = 300;

type Params = Promise<{ seasonId: string }>;

// Embed widget for a past season, e.g. /embed/season/20252026.
export default async function EmbedSeasonPage({ params }: { params: Params }) {
  const seasonId = parseSeasonId((await params).seasonId);
  if (!seasonId) notFound();
  return <StandingsPage seasonId={seasonId} embed />;
}
