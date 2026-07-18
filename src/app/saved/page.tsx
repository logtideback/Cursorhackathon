import { getFootballService } from "@/services";
import { SavedMatches } from "@/components/SavedMatches";

export default async function SavedPage() {
  const matches = await getFootballService().getMatches();
  return <SavedMatches matches={matches} />;
}
