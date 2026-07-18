import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Match } from "@/types/football";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKickoff } from "@/lib/format";

interface MatchCardProps {
  match: Match;
  index?: number;
}

function TeamMark({
  abbreviation,
  color,
}: {
  abbreviation: string;
  color: string;
}) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] font-bold tracking-wide"
      style={{
        background: `linear-gradient(145deg, ${color}55, ${color}18)`,
      }}
      aria-hidden
    >
      {abbreviation}
    </span>
  );
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
  return (
    <article
      className="card slide-up overflow-hidden transition-colors hover:bg-[var(--bg-card-hover)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--text-dim)] uppercase">
            {match.competition}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {match.status === "upcoming"
              ? formatKickoff(match.kickoff)
              : match.venue}
          </p>
        </div>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMark
            abbreviation={match.homeTeam.abbreviation}
            color={match.homeTeam.primaryColor}
          />
          <span className="truncate text-sm font-semibold">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="px-1 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight tabular-nums">
            {match.status === "upcoming"
              ? "vs"
              : `${match.score.home}–${match.score.away}`}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-semibold">
            {match.awayTeam.name}
          </span>
          <TeamMark
            abbreviation={match.awayTeam.abbreviation}
            color={match.awayTeam.primaryColor}
          />
        </div>
      </div>

      <p className="mt-4 px-4 text-sm leading-relaxed text-[var(--text-muted)]">
        {match.shortInsight}
      </p>

      <div className="mt-4 border-t border-[var(--border)] px-4 py-3">
        <Link
          href={`/match/${match.id}`}
          className="inline-flex w-full items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[rgba(184,255,60,0.2)]"
          aria-label={`Open match ${match.homeTeam.name} versus ${match.awayTeam.name}`}
        >
          <span>Open match</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
