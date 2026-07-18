import type { MatchStatus } from "@/types/football";
import { statusLabel } from "@/lib/format";

interface StatusBadgeProps {
  status: MatchStatus;
  minute?: number | null;
  compact?: boolean;
}

export function StatusBadge({ status, minute, compact }: StatusBadgeProps) {
  const isLive = status === "live";
  const label =
    isLive && minute != null ? `${minute}'` : statusLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${
        isLive
          ? "border-[rgba(255,77,77,0.35)] bg-[rgba(255,77,77,0.12)] text-[#ff8a8a]"
          : status === "finished"
            ? "border-[var(--border-strong)] bg-white/5 text-[var(--text-muted)]"
            : "border-[rgba(184,255,60,0.25)] bg-[var(--accent-soft)] text-[var(--accent)]"
      }`}
    >
      {isLive && (
        <span
          className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]"
          aria-hidden
        />
      )}
      <span>{compact && isLive ? "LIVE" : label}</span>
      {isLive && !compact && <span className="text-[10px] opacity-80">LIVE</span>}
    </span>
  );
}
