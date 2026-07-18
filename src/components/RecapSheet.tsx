"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import type { Match } from "@/types/football";
import { generateMatchRecap } from "@/lib/recap";

interface RecapSheetProps {
  match: Match;
  open: boolean;
  onClose: () => void;
}

export function RecapSheet({ match, open, onClose }: RecapSheetProps) {
  const [copied, setCopied] = useState(false);
  const recap = generateMatchRecap(match);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function copyRecap() {
    try {
      await navigator.clipboard.writeText(recap.fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close recap overlay"
        className="absolute inset-0 bg-black/65"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recap-title"
        className="sheet-in relative z-10 w-full max-w-[480px] rounded-t-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[var(--accent)]">
              <Share2 className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Shareable recap
              </span>
            </div>
            <h2
              id="recap-title"
              className="font-[family-name:var(--font-display)] text-xl font-semibold"
            >
              {recap.headline}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recap"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-white/5"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="card space-y-3 px-4 py-4 text-sm">
          <div>
            <p className="text-[11px] tracking-wide text-[var(--text-dim)] uppercase">
              Score
            </p>
            <p className="mt-1 font-semibold">{recap.scoreLine}</p>
          </div>
          <div>
            <p className="text-[11px] tracking-wide text-[var(--text-dim)] uppercase">
              Key moment
            </p>
            <p className="mt-1 text-[var(--text-muted)]">{recap.keyMoment}</p>
          </div>
          <div>
            <p className="text-[11px] tracking-wide text-[var(--text-dim)] uppercase">
              Momentum
            </p>
            <p className="mt-1 text-[var(--text-muted)]">{recap.momentumLeader}</p>
          </div>
          <div>
            <p className="text-[11px] tracking-wide text-[var(--text-dim)] uppercase">
              Recap
            </p>
            <p className="mt-1 leading-relaxed">{recap.oneSentence}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void copyRecap()}
          aria-label={copied ? "Recap copied" : "Copy recap"}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#0b1205] transition-transform active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Copied to clipboard
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copy recap
            </>
          )}
        </button>
      </div>
    </div>
  );
}
