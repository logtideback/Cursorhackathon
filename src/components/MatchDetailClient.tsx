"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import type { Match } from "@/types/football";
import { Scoreboard } from "@/components/Scoreboard";
import { MomentumDisplay } from "@/components/MomentumDisplay";
import { ScoutBriefing } from "@/components/ScoutBriefing";
import { EventTimeline } from "@/components/EventTimeline";
import { MatchStats } from "@/components/MatchStats";
import { ScoutChat } from "@/components/ScoutChat";
import { RecapSheet } from "@/components/RecapSheet";
import { useSavedMatches } from "@/hooks/useSavedMatches";

interface MatchDetailClientProps {
  match: Match;
}

export function MatchDetailClient({ match }: MatchDetailClientProps) {
  const [recapOpen, setRecapOpen] = useState(false);
  const { isSaved, toggleSave, hydrated } = useSavedMatches();
  const saved = hydrated && isSaved(match.id);

  return (
    <div className="page space-y-4">
      <div className="slide-up flex items-center justify-between gap-2">
        <Link
          href="/"
          aria-label="Back to matches"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/5 px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSave(match.id)}
            aria-label={saved ? "Unsave match" : "Save match"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4 text-[var(--accent)]" aria-hidden />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setRecapOpen(true)}
            aria-label="Create shareable recap"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[#0b1205]"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Create recap
          </button>
        </div>
      </div>

      <Scoreboard match={match} />
      <MomentumDisplay match={match} />
      <ScoutBriefing briefing={match.briefing} />
      <EventTimeline match={match} />
      <MatchStats match={match} />
      <ScoutChat match={match} />

      <RecapSheet
        match={match}
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
      />
    </div>
  );
}
