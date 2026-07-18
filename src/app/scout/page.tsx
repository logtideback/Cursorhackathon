import Link from "next/link";
import { ArrowUpRight, Crosshair } from "lucide-react";
import { getFootballService } from "@/services";
import { ScoutLanding } from "@/components/ScoutLanding";

export default async function ScoutPage() {
  const matches = await getFootballService().getMatches();
  const featured =
    matches.find((match) => match.status === "live") ?? matches[0] ?? null;

  return (
    <div className="page">
      <header className="slide-up mb-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(184,255,60,0.25)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          Ask Scout
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] leading-tight font-semibold tracking-tight">
          Scout AI
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          Understand any match in seconds. Ask about momentum, key moments, and
          what changed — answers come from structured match data.
        </p>
      </header>

      {featured ? (
        <ScoutLanding match={featured} />
      ) : (
        <div className="card px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          No matches available yet.
        </div>
      )}

      <section className="mt-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">
          Open a match
        </h2>
        <ul className="space-y-2">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/match/${match.id}`}
                className="card flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]"
                aria-label={`Open ${match.homeTeam.name} versus ${match.awayTeam.name}`}
              >
                <div>
                  <p className="text-sm font-semibold">
                    {match.homeTeam.abbreviation} vs {match.awayTeam.abbreviation}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                    {match.competition}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
