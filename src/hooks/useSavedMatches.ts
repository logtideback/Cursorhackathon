"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "scout-ai-saved-matches";

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useSavedMatches() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedIds(readSavedIds());
    setHydrated(true);
  }, []);

  const isSaved = useCallback(
    (matchId: string) => savedIds.includes(matchId),
    [savedIds],
  );

  const toggleSave = useCallback((matchId: string) => {
    setSavedIds((current) => {
      const next = current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId];
      writeSavedIds(next);
      return next;
    });
  }, []);

  return { savedIds, isSaved, toggleSave, hydrated };
}
