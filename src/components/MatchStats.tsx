import type { Match } from "@/types/football";

interface MatchStatsProps {
  match: Match;
}

interface StatRow {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}

function BarRow({
  label,
  home,
  away,
  homeColor,
  awayColor,
  suffix = "",
}: StatRow & { homeColor: string; awayColor: string }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  const awayPct = (away / total) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="tabular-nums font-semibold">
          {home}
          {suffix}
        </span>
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="tabular-nums font-semibold">
          {away}
          {suffix}
        </span>
      </div>
      <div className="flex h-2 gap-1">
        <div className="flex h-full flex-1 justify-end overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${homePct}%`, background: homeColor }}
          />
        </div>
        <div className="flex h-full flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${awayPct}%`, background: awayColor }}
          />
        </div>
      </div>
    </div>
  );
}

export function MatchStats({ match }: MatchStatsProps) {
  const stats: StatRow[] = [
    {
      label: "Possession",
      home: match.statistics.possession.home,
      away: match.statistics.possession.away,
      suffix: "%",
    },
    {
      label: "Shots",
      home: match.statistics.shots.home,
      away: match.statistics.shots.away,
    },
    {
      label: "On target",
      home: match.statistics.shotsOnTarget.home,
      away: match.statistics.shotsOnTarget.away,
    },
    {
      label: "Corners",
      home: match.statistics.corners.home,
      away: match.statistics.corners.away,
    },
    {
      label: "Fouls",
      home: match.statistics.fouls.home,
      away: match.statistics.fouls.away,
    },
  ];

  return (
    <section className="card slide-up px-4 py-4" aria-label="Match statistics">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Match statistics
        </h2>
        <div className="flex gap-3 text-[11px] text-[var(--text-dim)]">
          <span>{match.homeTeam.abbreviation}</span>
          <span>{match.awayTeam.abbreviation}</span>
        </div>
      </div>

      {match.status === "upcoming" ? (
        <p className="text-sm text-[var(--text-muted)]">
          Live stats unlock when the match begins.
        </p>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <BarRow
              key={stat.label}
              {...stat}
              homeColor={match.homeTeam.primaryColor}
              awayColor={match.awayTeam.primaryColor}
            />
          ))}
        </div>
      )}
    </section>
  );
}
