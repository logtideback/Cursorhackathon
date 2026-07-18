"use client";

import type { Match } from "@/types/football";
import { ScoutChat } from "@/components/ScoutChat";
import { StatusBadge } from "@/components/StatusBadge";

interface ScoutLandingProps {
  match: Match;
}

export function ScoutLanding({ match }: ScoutLandingProps) {
  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs text-[var(--text-dim)]">Featured match</p>
          <p className="mt-1 text-sm font-semibold">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
        </div>
        <StatusBadge status={match.status} minute={match.minute} compact />
      </div>
      <ScoutChat match={match} compact />
    </div>
  );
}
