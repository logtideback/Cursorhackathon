import { getFootballService } from "@/services";
import { HomeMatches } from "@/components/HomeMatches";

export default async function HomePage() {
  const service = getFootballService();
  const [matches, liveCount] = await Promise.all([
    service.getMatches(),
    service.getLiveMatchCount(),
  ]);

  return <HomeMatches matches={matches} liveCount={liveCount} />;
}
