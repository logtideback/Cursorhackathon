import type { Match, MatchFilter } from "@/types/football";

/**
 * Football data service abstraction.
 * UI layers should depend on this interface so mock data can be swapped
 * for a live TxLINE-backed implementation without rewriting screens.
 */
export interface FootballDataService {
  getMatches(filter?: MatchFilter): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  getLiveMatchCount(): Promise<number>;
}
