import type { Match, MatchStatus } from "@/types/football";

export function formatMatchClock(match: Match): string {
  if (match.status === "live" && match.minute != null) {
    return `${match.minute}'`;
  }
  if (match.status === "finished") return "FT";
  return "Upcoming";
}

export function formatKickoff(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(status: MatchStatus): string {
  if (status === "live") return "Live";
  if (status === "finished") return "Finished";
  return "Upcoming";
}
