import type { Match, MatchEvent } from "@/types/football";

function teamName(match: Match, teamId: string | null): string {
  if (!teamId) return "the match";
  if (teamId === match.homeTeam.id) return match.homeTeam.name;
  if (teamId === match.awayTeam.id) return match.awayTeam.name;
  return "a side";
}

function momentumLeaderName(match: Match): string {
  const leader = match.scoutInsight.momentumLeader;
  if (leader === "home") return match.homeTeam.name;
  if (leader === "away") return match.awayTeam.name;
  return "Neither side";
}

function latestGoals(match: Match): MatchEvent[] {
  return match.events.filter((event) => event.type === "goal");
}

function statusLine(match: Match): string {
  if (match.status === "live") {
    return `We're at ${match.minute}' with the score ${match.homeTeam.abbreviation} ${match.score.home}–${match.score.away} ${match.awayTeam.abbreviation}.`;
  }
  if (match.status === "upcoming") {
    return `${match.homeTeam.name} vs ${match.awayTeam.name} is still upcoming.`;
  }
  return `Full-time: ${match.homeTeam.name} ${match.score.home}–${match.score.away} ${match.awayTeam.name}.`;
}

function summariseMatch(match: Match): string {
  if (match.status === "upcoming") {
    return `${statusLine(match)} ${match.briefing}`;
  }

  const goals = latestGoals(match);
  const goalText =
    goals.length === 0
      ? "No goals yet."
      : goals
          .map(
            (goal) =>
              `${goal.minute}' ${teamName(match, goal.teamId)}${goal.playerName ? ` (${goal.playerName})` : ""}`,
          )
          .join("; ");

  return `${statusLine(match)} ${match.briefing} Key goals: ${goalText}.`;
}

function momentumAnswer(match: Match): string {
  if (match.status === "upcoming") {
    return `No live momentum yet. Pre-match outlook: ${match.scoutInsight.summary}`;
  }

  const leader = momentumLeaderName(match);
  if (leader === "Neither side") {
    return `Momentum looks balanced right now. ${match.scoutInsight.summary} Watch for ${match.scoutInsight.keyThreat}.`;
  }

  return `${leader} currently hold the momentum. ${match.scoutInsight.summary} The clearest threat is ${match.scoutInsight.keyThreat}.`;
}

function halfTimeAnswer(match: Match): string {
  const halfTime = match.events.find((event) => event.type === "half_time");
  if (!halfTime) {
    if (match.status === "upcoming") {
      return "The match has not started, so there is no half-time shift to analyse yet.";
    }
    return "Half-time has not been reached in the available match data.";
  }

  const after = match.events.filter((event) => event.minute > 45);
  const afterText =
    after.length === 0
      ? "The second half is still settling."
      : after
          .slice(0, 3)
          .map((event) => `${event.minute}' ${event.description}`)
          .join(" ");

  return `After half-time (${halfTime.description}) the pattern shifted. ${afterText} ${match.briefing}`;
}

function keyMomentsAnswer(match: Match): string {
  if (match.events.length === 0) {
    return `No major events yet. Pre-match brief: ${match.shortInsight}`;
  }

  const highlights = match.events
    .filter((event) =>
      ["goal", "momentum_shift", "yellow_card", "substitution", "half_time", "full_time"].includes(
        event.type,
      ),
    )
    .slice(-5);

  const lines = highlights
    .map((event) => `${event.minute}' — ${event.description}`)
    .join(" ");

  return `Key moments so far: ${lines}`;
}

function fallbackAnswer(match: Match, question: string): string {
  const lower = question.toLowerCase();

  if (lower.includes("score") || lower.includes("result")) {
    return statusLine(match);
  }

  if (lower.includes("possession") || lower.includes("stat")) {
    const { possession, shots, shotsOnTarget } = match.statistics;
    if (match.status === "upcoming") {
      return "Live statistics will appear once the match kicks off.";
    }
    return `Possession is ${possession.home}%–${possession.away}%. Shots ${shots.home}–${shots.away} (${shotsOnTarget.home}–${shotsOnTarget.away} on target).`;
  }

  if (lower.includes("who") && lower.includes("better")) {
    return momentumAnswer(match);
  }

  return `${statusLine(match)} Based on the available structured match data: ${match.shortInsight} Ask about momentum, key moments, or the half-time shift for a sharper brief.`;
}

/**
 * Rule-based Scout responses from local match data.
 * No external AI API required. Optional OPENAI_API_KEY can later enrich this.
 */
export function generateScoutResponse(match: Match, question: string): string {
  const q = question.trim().toLowerCase();

  if (!q) {
    return "Ask Scout about the match so far, momentum, or key moments.";
  }

  if (
    q.includes("summar") ||
    q.includes("so far") ||
    q.includes("overview") ||
    q.includes("what happened")
  ) {
    return summariseMatch(match);
  }

  if (q.includes("momentum") || q.includes("control") || q.includes("pressing")) {
    return momentumAnswer(match);
  }

  if (q.includes("half-time") || q.includes("half time") || q.includes("after half")) {
    return halfTimeAnswer(match);
  }

  if (
    q.includes("key moment") ||
    q.includes("key moments") ||
    q.includes("highlight") ||
    q.includes("events")
  ) {
    return keyMomentsAnswer(match);
  }

  return fallbackAnswer(match, question);
}

export const SUGGESTED_QUESTIONS = [
  "Summarise the match so far",
  "Who currently has momentum?",
  "What changed after half-time?",
  "What are the key moments?",
] as const;
