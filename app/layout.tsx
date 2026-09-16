import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "True NHL Standings",
  description:
    "NHL standings recalculated so a regulation win actually counts for more than an overtime loss.",
};

// Google Analytics measurement id (G-XXXXXXXXXX). Set NEXT_PUBLIC_GA_ID in
// the environment to turn tracking on; leave it unset (e.g. locally) and no
// analytics script is loaded at all.
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
