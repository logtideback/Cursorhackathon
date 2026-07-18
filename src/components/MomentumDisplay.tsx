import type { Match } from "@/types/football";

interface MomentumDisplayProps {
  match: Match;
}

export function MomentumDisplay({ match }: MomentumDisplayProps) {
  const points = match.momentum;
  const latest = points.length > 0 ? points[points.length - 1].value : 0;
  const homeShare = Math.max(8, Math.min(92, 50 + latest / 2));
  const awayShare = 100 - homeShare;

  const leader =
    match.scoutInsight.momentumLeader === "home"
      ? match.homeTeam.name
      : match.scoutInsight.momentumLeader === "away"
        ? match.awayTeam.name
        : "Balanced";

  const width = 280;
  const height = 56;
  const path =
    points.length > 1
      ? points
          .map((point, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height / 2 - (point.value / 100) * (height / 2 - 4);
            return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(" ")
      : `M 0 ${height / 2} L ${width} ${height / 2}`;

  return (
    <section className="card slide-up px-4 py-4" aria-label="Match momentum">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Momentum
        </h2>
        <p className="text-xs text-[var(--text-muted)]">{leader}</p>
      </div>

      {match.status === "upcoming" ? (
        <p className="text-sm text-[var(--text-muted)]">
          Momentum tracking begins at kick-off.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mb-3 h-14 w-full"
            role="img"
            aria-label={`Momentum trend favouring ${leader}`}
          >
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-l-full transition-all duration-500"
              style={{
                width: `${homeShare}%`,
                background: match.homeTeam.primaryColor,
              }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-500"
              style={{
                width: `${awayShare}%`,
                background: match.awayTeam.primaryColor,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[var(--text-dim)]">
            <span>{match.homeTeam.abbreviation}</span>
            <span>{match.awayTeam.abbreviation}</span>
          </div>
        </>
      )}
    </section>
  );
}
