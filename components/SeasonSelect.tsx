"use client";

import { useRouter } from "next/navigation";

export interface SeasonOption {
  id: number;
  label: string;
  href: string;
}

/** Dropdown that navigates between seasons (each season is its own URL). */
export function SeasonSelect({ options, currentId }: { options: SeasonOption[]; currentId: number }) {
  const router = useRouter();

  return (
    <label className="season-select">
      <span>Season</span>
      <select
        value={currentId}
        onChange={(e) => {
          const next = options.find((o) => o.id === Number(e.target.value));
          // Keep the selected view (#real / #diff) when changing season.
          if (next) router.push(next.href + window.location.hash);
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
