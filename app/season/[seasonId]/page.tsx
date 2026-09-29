import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandingsPage } from "@/components/StandingsPage";
import { formatSeason, parseSeasonId } from "@/lib/seasons";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 300;

type Params = Promise<{ seasonId: string }>;

// So a shared season link reads "2025–26 season" rather than the generic
// site title. Everything else (image, description) is inherited from the
// root layout.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const seasonId = parseSeasonId((await params).seasonId);
  if (!seasonId) return {};

  const title = `${formatSeason(seasonId)} season`;
  const shareTitle = `${SITE_NAME} · ${title}`;

  // Next replaces the whole openGraph/twitter object rather than merging, so
  // the shared image and description are restated here, not inherited.
  return {
    title,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description: SITE_DESCRIPTION,
      url: `/season/${seasonId}`,
      locale: "en_US",
      images: OG_IMAGE,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: SITE_DESCRIPTION,
      images: OG_IMAGE,
    },
  };
}

// A past season, e.g. /season/20252026.
export default async function SeasonPage({ params }: { params: Params }) {
  const seasonId = parseSeasonId((await params).seasonId);
  if (!seasonId) notFound();
  return <StandingsPage seasonId={seasonId} />;
}
