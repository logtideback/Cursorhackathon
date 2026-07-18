import { notFound } from "next/navigation";
import { getFootballService } from "@/services";
import { MatchDetailClient } from "@/components/MatchDetailClient";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const matches = await getFootballService().getMatches();
  return matches.map((match) => ({ id: match.id }));
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const match = await getFootballService().getMatchById(id);

  if (!match) {
    notFound();
  }

  return <MatchDetailClient match={match} />;
}
