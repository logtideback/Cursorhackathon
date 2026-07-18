"use client";

import { useMemo, useState } from "react";
import { Radio } from "lucide-react";
import type { Match, MatchFilter } from "@/types/football";
import { AppHeader } from "@/components/AppHeader";
import { MatchCard } from "@/components/MatchCard";
import { MatchFilters } from "@/components/MatchFilters";
import { EmptyState } from "@/components/EmptyState";

interface HomeMatchesProps {
  matches: Match[];
  liveCount: number;
}

export function HomeMatches({ matches, liveCount }: HomeMatchesProps) {
  const defaultFilter: MatchFilter =
    liveCount > 0 ? "live" : matches.some((m) => m.status === "upcoming")
      ? "upcoming"
      : "finished";

  const [filter, setFilter] = useState<MatchFilter>(defaultFilter);

  const counts = useMemo(
    () => ({
      live: matches.filter((m) => m.status === "live").length,
      upcoming: matches.filter((m) => m.status === "upcoming").length,
      finished: matches.filter((m) => m.status === "finished").length,
    }),
    [matches],
  );

  const filtered = matches.filter((match) => match.status === filter);

  return (
    <div className="page">
      <AppHeader liveCount={liveCount} />
      <MatchFilters value={filter} onChange={setFilter} counts={counts} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Radio}
          title={`No ${filter} matches`}
          description="Switch filters to browse upcoming or finished fixtures in the demo set."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((match, index) => (
            <MatchCard key={match.id} match={match} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
