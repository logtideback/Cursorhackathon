import { MOCK_MATCHES } from "@/data/mock-matches";
import type { Match, MatchFilter } from "@/types/football";
import type { FootballDataService } from "@/services/football-data";

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockFootballService implements FootballDataService {
  async getMatches(filter?: MatchFilter): Promise<Match[]> {
    await delay();
    if (!filter) return [...MOCK_MATCHES];
    return MOCK_MATCHES.filter((match) => match.status === filter);
  }

  async getMatchById(id: string): Promise<Match | null> {
    await delay();
    return MOCK_MATCHES.find((match) => match.id === id) ?? null;
  }

  async getLiveMatchCount(): Promise<number> {
    await delay(80);
    return MOCK_MATCHES.filter((match) => match.status === "live").length;
  }
}

export const mockFootballService = new MockFootballService();
