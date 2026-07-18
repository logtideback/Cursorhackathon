import type { Match } from "@/types/football";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKickoff, formatMatchClock } from "@/lib/format";

interface ScoreboardProps {
  match: Match;
}

export function Scoreboard({ match }: ScoreboardProps) {
  return (
    <section className="card slide-up overflow-hidden px-4 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--text-dim)] uppercase">
            {match.competition}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{match.venue}</p>
        </div>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-center">
          <div
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-sm font-bold"
            style={{
              background: `linear-gradient(145deg, ${match.homeTeam.primaryColor}66, ${match.homeTeam.primaryColor}20)`,
            }}
          >
            {match.homeTeam.abbreviation}
          </div>
          <p className="text-sm font-semibold">{match.homeTeam.name}</p>
        </div>

        <div className="min-w-[88px] text-center">
          <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight tabular-nums">
            {match.status === "upcoming"
              ? "–"
              : `${match.score.home}–${match.score.away}`}
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
            {match.status === "upcoming"
              ? formatKickoff(match.kickoff)
              : formatMatchClock(match)}
          </p>
        </div>

        <div className="text-center">
          <div
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-sm font-bold"
            style={{
              background: `linear-gradient(145deg, ${match.awayTeam.primaryColor}66, ${match.awayTeam.primaryColor}20)`,
            }}
          >
            {match.awayTeam.abbreviation}
          </div>
          <p className="text-sm font-semibold">{match.awayTeam.name}</p>
        </div>
      </div>
    </section>
  );
}
