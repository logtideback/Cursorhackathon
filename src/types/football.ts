export type MatchStatus = "live" | "upcoming" | "finished";

export type EventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "half_time"
  | "momentum_shift"
  | "kickoff"
  | "full_time";

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: EventType;
  teamId: string | null;
  description: string;
  playerName?: string;
}

export interface MatchStatistics {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
}

export interface MomentumPoint {
  minute: number;
  value: number; // -100 (away) to 100 (home)
}

export interface ScoutInsight {
  summary: string;
  momentumLeader: "home" | "away" | "even";
  keyThreat: string;
}

export interface Match {
  id: string;
  competition: string;
  venue: string;
  kickoff: string; // ISO
  status: MatchStatus;
  minute: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: MatchScore;
  shortInsight: string;
  briefing: string;
  events: MatchEvent[];
  statistics: MatchStatistics;
  momentum: MomentumPoint[];
  scoutInsight: ScoutInsight;
}

export type MatchFilter = "live" | "upcoming" | "finished";

export interface MatchRecap {
  headline: string;
  scoreLine: string;
  keyMoment: string;
  momentumLeader: string;
  oneSentence: string;
  fullText: string;
}
