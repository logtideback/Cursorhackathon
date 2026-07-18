"use client";

import type { MatchFilter } from "@/types/football";

const filters: { id: MatchFilter; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "finished", label: "Finished" },
];

interface MatchFiltersProps {
  value: MatchFilter;
  onChange: (filter: MatchFilter) => void;
  counts: Record<MatchFilter, number>;
}

export function MatchFilters({ value, onChange, counts }: MatchFiltersProps) {
  return (
    <div
      className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="tablist"
      aria-label="Match filters"
    >
      {filters.map((filter) => {
        const active = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${filter.label} matches`}
            onClick={() => onChange(filter.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-[var(--accent)] text-[#0b1205]"
                : "border border-[var(--border)] bg-white/5 text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {filter.label}
            <span className={`ml-1.5 text-xs ${active ? "opacity-70" : "opacity-50"}`}>
              {counts[filter.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
