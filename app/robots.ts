import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// There was no robots.txt at all (a 404), which some crawlers — Facebook's
// scraper among them — report as a block rather than "no restrictions".
// This serves an explicit, permissive one.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    host: SITE_URL,
  };
}
