"use client";

import { useEffect, useState } from "react";

const UTC_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

const LOCAL_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * Renders a sync timestamp in the reader's own timezone.
 *
 * The server has no idea what timezone the reader is in, so it renders UTC
 * (which the first client render must match, or React reports a hydration
 * mismatch); once mounted we re-format in local time. The machine-readable
 * value stays in the `datetime` attribute either way.
 */
export function LastUpdated({ iso }: { iso: string }) {
  const [label, setLabel] = useState(
    () => `${new Date(iso).toLocaleString("en-US", UTC_OPTIONS)} UTC`,
  );

  useEffect(() => {
    setLabel(new Date(iso).toLocaleString(undefined, LOCAL_OPTIONS));
  }, [iso]);

  return <time dateTime={iso}>{label}</time>;
}
