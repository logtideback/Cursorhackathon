"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import type { Match } from "@/types/football";
import { generateScoutResponse } from "@/lib/scout-responses";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";

interface ChatMessage {
  id: string;
  role: "user" | "scout";
  content: string;
}

interface ScoutChatProps {
  match: Match;
  compact?: boolean;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ScoutChat({ match, compact }: ScoutChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "scout",
      content: `Ask me anything about ${match.homeTeam.name} vs ${match.awayTeam.name}. I'll answer from the available structured match data.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    const delay = 500 + Math.floor(Math.random() * 300);
    await wait(delay);

    const reply = generateScoutResponse(match, trimmed);
    setMessages((current) => [
      ...current,
      {
        id: `s-${Date.now()}`,
        role: "scout",
        content: reply,
      },
    ]);
    setLoading(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <section className="card slide-up overflow-hidden" aria-label="Ask Scout">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Ask Scout
        </h2>
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          Insights generated from available match data.
        </p>
      </div>

      <div className={`space-y-3 px-4 py-4 ${compact ? "max-h-72" : "max-h-96"} overflow-y-auto`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "rounded-br-md bg-[var(--accent)] text-[#0b1205]"
                  : "rounded-bl-md border border-[var(--border)] bg-white/5 text-[var(--text)]"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start" aria-live="polite">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[var(--border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--text-muted)]">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Scout is reading the data…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <SuggestedQuestions onSelect={(q) => void ask(q)} disabled={loading} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-3"
      >
        <label htmlFor="scout-input" className="sr-only">
          Ask Scout a question
        </label>
        <input
          id="scout-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about momentum, moments…"
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-dim)] focus:border-[rgba(184,255,60,0.4)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send question to Scout"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[#0b1205] transition-opacity disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
