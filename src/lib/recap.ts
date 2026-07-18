import type { Match, MatchRecap } from "@/types/football";

function momentumLeaderLabel(match: Match): string {
  const leader = match.scoutInsight.momentumLeader;
  if (leader === "home") return match.homeTeam.name;
  if (leader === "away") return match.awayTeam.name;
  return "Evenly balanced";
}

function keyMoment(match: Match): string {
  const goals = match.events.filter((event) => event.type === "goal");
  if (goals.length > 0) {
    const latest = goals[goals.length - 1];
    return `${latest.minute}' ${latest.description}`;
  }

  const shift = [...match.events]
    .reverse()
    .find((event) => event.type === "momentum_shift");
  if (shift) {
    return `${shift.minute}' ${shift.description}`;
  }

  if (match.status === "upcoming") {
    return "Kick-off still to come — watch the early press.";
  }

  return match.shortInsight;
}

export function generateMatchRecap(match: Match): MatchRecap {
  const scoreLine = `${match.homeTeam.name} ${match.score.home}–${match.score.away} ${match.awayTeam.name}`;
  const leader = momentumLeaderLabel(match);
  const moment = keyMoment(match);
  const oneSentence =
    match.status === "upcoming"
      ? `${match.homeTeam.name} face ${match.awayTeam.name} with contrasting styles set to define the opener.`
      : match.scoutInsight.summary;

  const headline =
    match.status === "live"
      ? `Live: ${match.homeTeam.abbreviation} ${match.score.home}–${match.score.away} ${match.awayTeam.abbreviation}`
      : match.status === "finished"
        ? `FT: ${scoreLine}`
        : `Preview: ${match.homeTeam.name} vs ${match.awayTeam.name}`;

  const fullText = [
    headline,
    `Score: ${scoreLine}`,
    `Key moment: ${moment}`,
    `Momentum: ${leader}`,
    oneSentence,
    "— Scout AI · insights from structured match data",
  ].join("\n");

  return {
    headline,
    scoreLine,
    keyMoment: moment,
    momentumLeader: leader,
    oneSentence,
    fullText,
  };
}
