import type { Match, MatchFilter } from "@/types/football";
import type { FootballDataService } from "@/services/football-data";

/**
 * Placeholder TxLINE integration.
 *
 * TODO: When TxLINE credentials and docs are available:
 * 1. Read TXLINE_API_URL and TXLINE_API_KEY from environment.
 * 2. Implement authenticated GET requests for fixtures / live events / stats.
 * 3. Map TxLINE response fields into the shared Match type in `mapTxlineMatch`.
 * 4. Wire `getFootballService()` to return this class when credentials exist.
 * 5. Keep error handling graceful so the UI can fall back to mock data if needed.
 */
export class TxlineFootballService implements FootballDataService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  async getMatches(filter?: MatchFilter): Promise<Match[]> {
    // TODO: GET `${this.apiUrl}/matches` with Authorization header
    // TODO: Map response payload via mapTxlineMatch()
    // TODO: Apply `filter` client-side or via query params once the API shape is known
    void filter;
    void this.apiUrl;
    void this.apiKey;
    throw new Error(
      "TxLINE service not implemented yet. Configure credentials and complete field mapping.",
    );
  }

  async getMatchById(id: string): Promise<Match | null> {
    // TODO: GET `${this.apiUrl}/matches/:id`
    // TODO: Include events, statistics, and momentum series in the mapping layer
    void id;
    throw new Error(
      "TxLINE service not implemented yet. Configure credentials and complete field mapping.",
    );
  }

  async getLiveMatchCount(): Promise<number> {
    // TODO: Prefer a lightweight live-count endpoint if TxLINE exposes one
    const matches = await this.getMatches("live");
    return matches.length;
  }
}

/**
 * TODO: Map a raw TxLINE match payload into the app's Match model.
 * Keep this function pure so mapping can be unit-tested independently.
 */
export function mapTxlineMatch(payload: unknown): Match {
  // TODO: Extract competition, teams, score, minute/status, events, stats
  void payload;
  throw new Error("mapTxlineMatch is not implemented yet.");
}
