"use client";

import { SUGGESTED_QUESTIONS } from "@/lib/scout-responses";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({
  onSelect,
  disabled,
}: SuggestedQuestionsProps) {
  return (
    <section aria-label="Suggested questions">
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">
        Suggested questions
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            aria-label={`Ask: ${question}`}
            className="shrink-0 rounded-full border border-[var(--border-strong)] bg-white/5 px-3.5 py-2 text-left text-xs font-medium text-[var(--text)] transition-colors hover:border-[rgba(184,255,60,0.35)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}
