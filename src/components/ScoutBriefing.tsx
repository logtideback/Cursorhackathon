import { Sparkles } from "lucide-react";

interface ScoutBriefingProps {
  briefing: string;
}

export function ScoutBriefing({ briefing }: ScoutBriefingProps) {
  return (
    <section className="card slide-up border-[rgba(184,255,60,0.18)] px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Scout Briefing
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text)]">{briefing}</p>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-dim)]">
        Generated from live structured match data — not video analysis.
      </p>
    </section>
  );
}
