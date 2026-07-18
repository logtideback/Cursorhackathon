import type { FootballDataService } from "@/services/football-data";
import { mockFootballService } from "@/services/mock-football-service";

/**
 * Returns the active football data service.
 *
 * TODO: When TxLINE mapping is complete, prefer TxlineFootballService when
 * TXLINE_API_URL and TXLINE_API_KEY are both set, and catch failures to fall
 * back to mockFootballService for demos.
 *
 * Optional OPENAI_API_KEY can later power richer Ask Scout answers; the MVP
 * uses a local rule-based generator and needs no keys.
 */
export function getFootballService(): FootballDataService {
  // Always use mock data until TxLINE field mapping is implemented.
  // Credentials are read here so the swap point is obvious for later work.
  const hasTxline =
    Boolean(process.env.TXLINE_API_URL) && Boolean(process.env.TXLINE_API_KEY);

  if (hasTxline) {
    // Placeholder: return new TxlineFootballService(url, key) once ready.
    console.info(
      "[Scout AI] TxLINE credentials detected, but mock data is still active until mapping is implemented.",
    );
  }

  return mockFootballService;
}

export { mockFootballService };
export type { FootballDataService };
