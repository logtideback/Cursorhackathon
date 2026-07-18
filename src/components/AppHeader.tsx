import { Radio } from "lucide-react";

interface AppHeaderProps {
  liveCount?: number;
  title?: string;
  subtitle?: string;
}

export function AppHeader({
  liveCount = 0,
  title = "Understand every match",
  subtitle = "Live football intelligence, explained by AI.",
}: AppHeaderProps) {
  return (
    <header className="slide-up mb-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(184,255,60,0.3)] bg-[linear-gradient(145deg,#1a2a12,#0d1410)] shadow-[0_0_24px_rgba(184,255,60,0.12)]"
            aria-hidden
          >
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--accent)]">
              S
            </span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              Scout AI
            </p>
            <p className="text-xs text-[var(--text-dim)]">Match companion</p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)]"
          aria-live="polite"
        >
          <Radio
            className={`h-3.5 w-3.5 ${liveCount > 0 ? "text-[var(--live)]" : "text-[var(--text-dim)]"}`}
            aria-hidden
          />
          <span>
            {liveCount > 0 ? (
              <>
                <span className="font-semibold text-[#ff8a8a]">{liveCount} live</span>
              </>
            ) : (
              "No live matches"
            )}
          </span>
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] leading-[1.1] font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
        {subtitle}
      </p>
    </header>
  );
}
