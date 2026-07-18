import {
  ArrowLeftRight,
  CircleDot,
  Clock3,
  Flag,
  RectangleVertical,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Match, MatchEvent } from "@/types/football";

interface EventTimelineProps {
  match: Match;
}

function eventIcon(type: MatchEvent["type"]) {
  switch (type) {
    case "goal":
      return Target;
    case "yellow_card":
    case "red_card":
      return RectangleVertical;
    case "substitution":
      return ArrowLeftRight;
    case "half_time":
    case "full_time":
      return Clock3;
    case "momentum_shift":
      return TrendingUp;
    case "kickoff":
      return CircleDot;
    default:
      return Flag;
  }
}

function eventAccent(type: MatchEvent["type"]): string {
  if (type === "goal") return "text-[var(--accent)] bg-[var(--accent-soft)]";
  if (type === "yellow_card") return "text-[#f5d76e] bg-[rgba(245,215,110,0.12)]";
  if (type === "red_card") return "text-[#ff8a8a] bg-[rgba(255,77,77,0.12)]";
  if (type === "momentum_shift") return "text-[#7dd3fc] bg-[rgba(125,211,252,0.12)]";
  return "text-[var(--text-muted)] bg-white/5";
}

export function EventTimeline({ match }: EventTimelineProps) {
  const events = [...match.events].sort((a, b) => b.minute - a.minute);

  return (
    <section className="card slide-up px-4 py-4" aria-label="Key events">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">
        Key events
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Events will appear once the match starts.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => {
            const Icon = eventIcon(event.type);
            const team =
              event.teamId === match.homeTeam.id
                ? match.homeTeam.abbreviation
                : event.teamId === match.awayTeam.id
                  ? match.awayTeam.abbreviation
                  : null;

            return (
              <li key={event.id} className="flex gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${eventAccent(event.type)}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 border-b border-[var(--border)] pb-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-dim)]">
                    <span className="font-semibold text-[var(--text-muted)]">
                      {event.minute}&apos;
                    </span>
                    {team ? (
                      <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5">
                        {team}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed">{event.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
