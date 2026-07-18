"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { Match } from "@/types/football";
import { useSavedMatches } from "@/hooks/useSavedMatches";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";

interface SavedMatchesProps {
  matches: Match[];
}

export function SavedMatches({ matches }: SavedMatchesProps) {
  const { savedIds, hydrated } = useSavedMatches();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hydrated) setReady(true);
  }, [hydrated]);

  const savedMatches = matches.filter((match) => savedIds.includes(match.id));

  return (
    <div className="page">
      <header className="slide-up mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] font-semibold tracking-tight">
          Saved
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Matches you pin for quick access. Stored locally on this device.
        </p>
      </header>

      {!ready ? (
        <div className="card px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          Loading saved matches…
        </div>
      ) : savedMatches.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved matches yet"
          description="Open a match and tap the bookmark to keep it here for later."
          action={
            <Link
              href="/"
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0b1205]"
            >
              Browse matches
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {savedMatches.map((match, index) => (
            <MatchCard key={match.id} match={match} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
