// Site-level constants shared by the metadata in every route.
//
// Next.js *replaces* rather than merges the `openGraph` object when a page
// sets its own, so any page overriding a single field (a season title, say)
// has to restate the image too — hence these live here rather than only in
// the root layout.

import type { Metadata } from "next";

/** Absolute URLs are required for social share previews. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truenhlstandings.ca";

export const SITE_NAME = "True NHL Standings";

export const SITE_DESCRIPTION =
  "NHL standings with a better point system: 3 points for a regulation win, " +
  "2 for an overtime or shootout win, 1 for an OT/SO loss. Two losses should " +
  "never equal a win.";

export const OG_IMAGE: NonNullable<NonNullable<Metadata["openGraph"]>["images"]> = [
  {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "True NHL Standings — 3 points for a regulation win, 2 for an OT/SO win, 1 for an OT/SO loss, 0 for a regulation loss.",
  },
];
