import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COLLECTIONS_QUERY_KEY } from '@/features/collections/constants';
import {
  DECK_PAGE_SIZE,
  DECK_REFILL_THRESHOLD,
  DISCOVER_QUERY_KEY,
} from '@/features/discover/constants';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import { useImagePreload } from '@/features/discover/hooks/useImagePreload';
import { fetchRecommendedFeed } from '@/features/discover/recommendation/feed';
import type {
  DeckStatus,
  DiscoverCard,
  SwipeHistoryEntry,
  UndoToastState,
} from '@/features/discover/types';
import { isEnvConfigured } from '@/lib/env';
import { recordSwipe, undoLastSwipe } from '@/services/designs';
import type { SwipeDirection } from '@/types/database';
import { friendlyAuthError } from '@/utils/auth-errors';

const emptyToast: UndoToastState = {
  visible: false,
  direction: null,
  designId: null,
  title: null,
  message: '',
};

async function loadDesignPage(existingIds: Set<string>): Promise<DiscoverCard[]> {
  const page = await fetchRecommendedFeed({
    limit: DECK_PAGE_SIZE,
    excludeIds: [...existingIds],
  });
  return page.filter((card) => !existingIds.has(card.id) && Boolean(card.imageUrl));
}

export function useDiscoverDeck() {
  const queryClient = useQueryClient();
  const [deck, setDeck] = useState<DiscoverCard[]>([]);
  const [status, setStatus] = useState<DeckStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [sessionSwipes, setSessionSwipes] = useState(0);
  const [sessionSaves, setSessionSaves] = useState(0);
  const [toast, setToast] = useState<UndoToastState>(emptyToast);
  const [failedSwipe, setFailedSwipe] = useState<{
    card: DiscoverCard;
    direction: SwipeDirection;
  } | null>(null);

  const historyRef = useRef<SwipeHistoryEntry[]>([]);
  const pendingIdsRef = useRef(new Set<string>());
  const seenIdsRef = useRef(new Set<string>());
  const refillInFlight = useRef(false);
  const mountedRef = useRef(true);

  useImagePreload(deck);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      if (mountedRef.current) {
        setIsOffline(offline);
      }
    });
    return unsubscribe;
  }, []);

  const activeCard = deck[0] ?? null;
  const nextCards = useMemo(() => deck.slice(1, 3), [deck]);

  const refillDeck = useCallback(
    async (force = false) => {
      if (refillInFlight.current) {
        return;
      }
      if (!force && deck.length > DECK_REFILL_THRESHOLD) {
        return;
      }

      refillInFlight.current = true;
      if (mountedRef.current) {
        setIsRefilling(true);
      }

      try {
        const page = await loadDesignPage(seenIdsRef.current);
        page.forEach((card) => seenIdsRef.current.add(card.id));

        if (!mountedRef.current) {
          return;
        }

        setDeck((current) => {
          const existing = new Set(current.map((card) => card.id));
          const appended = page.filter((card) => !existing.has(card.id));
          const next = [...current, ...appended];
          setStatus(next.length === 0 ? 'empty' : 'ready');
          return next;
        });
        setErrorMessage(null);
      } catch (error) {
        if (mountedRef.current && deck.length === 0) {
          setStatus('error');
          setErrorMessage(friendlyAuthError(error));
        }
      } finally {
        refillInFlight.current = false;
        if (mountedRef.current) {
          setIsRefilling(false);
        }
      }
    },
    [deck.length],
  );

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    seenIdsRef.current = new Set();
    historyRef.current = [];
    pendingIdsRef.current = new Set();
    setDeck([]);
    setFailedSwipe(null);
    setToast(emptyToast);
    setSessionSwipes(0);
    setSessionSaves(0);

    try {
      const page = await loadDesignPage(new Set());
      page.forEach((card) => seenIdsRef.current.add(card.id));
      if (!mountedRef.current) {
        return;
      }
      setDeck(page);
      setStatus(page.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      if (mountedRef.current) {
        setStatus('error');
        setErrorMessage(friendlyAuthError(error));
      }
    }
  }, []);

  useEffect(() => {
    // Initial page load for the Discover deck.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time data fetch
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'ready' && deck.length <= DECK_REFILL_THRESHOLD) {
      void refillDeck();
    }
  }, [deck.length, refillDeck, status]);

  const swipeMutation = useMutation({
    mutationFn: async ({ card, direction }: { card: DiscoverCard; direction: SwipeDirection }) => {
      if (isMockDesignId(card.id) || card.source === 'mock' || !isEnvConfigured()) {
        return {
          swipe_id: `local-${card.id}`,
          design_id: card.id,
          direction,
          created_at: new Date().toISOString(),
          collection_item_id: direction === 'right' ? `local-item-${card.id}` : null,
          save_count: card.saveCount + (direction === 'right' ? 1 : 0),
          localOnly: true as const,
        };
      }
      const result = await recordSwipe(card.id, direction);
      return { ...result, localOnly: false as const };
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (entry: SwipeHistoryEntry) => {
      if (!entry.recordedRemotely || isMockDesignId(entry.card.id) || !isEnvConfigured()) {
        return { localOnly: true as const, design: entry.card };
      }
      const result = await undoLastSwipe();
      return { localOnly: false as const, result };
    },
  });

  const commitSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const card = deck[0];
      if (!card) {
        return;
      }
      if (pendingIdsRef.current.has(card.id) || submittingId) {
        return;
      }

      pendingIdsRef.current.add(card.id);
      setSubmittingId(card.id);
      setFailedSwipe(null);

      setDeck((current) => current.slice(1));
      setSessionSwipes((count) => count + 1);
      if (direction === 'right') {
        setSessionSaves((count) => count + 1);
      }

      try {
        const result = await swipeMutation.mutateAsync({ card, direction });
        historyRef.current.push({
          card,
          direction,
          recordedRemotely: !result.localOnly,
          swipeId: result.swipe_id,
        });

        setToast({
          visible: true,
          direction,
          designId: card.id,
          title: card.title,
          message:
            direction === 'right'
              ? 'Saved to your Saved collection'
              : 'Passed — we will show fewer like this',
        });

        void queryClient.invalidateQueries({ queryKey: DISCOVER_QUERY_KEY });
        if (direction === 'right') {
          void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
        }
      } catch (error) {
        setDeck((current) => [card, ...current.filter((item) => item.id !== card.id)]);
        setSessionSwipes((count) => Math.max(0, count - 1));
        if (direction === 'right') {
          setSessionSaves((count) => Math.max(0, count - 1));
        }
        setFailedSwipe({ card, direction });
        setErrorMessage(friendlyAuthError(error));
        setToast(emptyToast);
      } finally {
        pendingIdsRef.current.delete(card.id);
        setSubmittingId(null);
      }
    },
    [deck, queryClient, submittingId, swipeMutation],
  );

  const undo = useCallback(async () => {
    const entry = historyRef.current[historyRef.current.length - 1];
    if (!entry || undoMutation.isPending) {
      return;
    }

    try {
      await undoMutation.mutateAsync(entry);
      historyRef.current.pop();
      setDeck((current) => {
        if (current.some((card) => card.id === entry.card.id)) {
          return current;
        }
        return [entry.card, ...current];
      });
      setSessionSwipes((count) => Math.max(0, count - 1));
      if (entry.direction === 'right') {
        setSessionSaves((count) => Math.max(0, count - 1));
      }
      setToast(emptyToast);
      setFailedSwipe(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(friendlyAuthError(error));
    }
  }, [undoMutation]);

  const retryFailedSwipe = useCallback(async () => {
    if (!failedSwipe) {
      return;
    }
    const { card, direction } = failedSwipe;
    setFailedSwipe(null);
    setErrorMessage(null);

    if (deck[0]?.id !== card.id) {
      setDeck((current) => [card, ...current.filter((item) => item.id !== card.id)]);
    }

    // Allow next commitSwipe call from UI after restore
    pendingIdsRef.current.delete(card.id);
    setSubmittingId(null);

    // Re-trigger after state flush
    requestAnimationFrame(() => {
      void (async () => {
        pendingIdsRef.current.add(card.id);
        setSubmittingId(card.id);
        setDeck((current) => current.filter((item) => item.id !== card.id));
        try {
          const result = await swipeMutation.mutateAsync({ card, direction });
          historyRef.current.push({
            card,
            direction,
            recordedRemotely: !result.localOnly,
            swipeId: result.swipe_id,
          });
          setSessionSwipes((count) => count + 1);
          if (direction === 'right') {
            setSessionSaves((count) => count + 1);
          }
          setToast({
            visible: true,
            direction,
            designId: card.id,
            title: card.title,
            message:
              direction === 'right'
                ? 'Saved to your Saved collection'
                : 'Passed — we will show fewer like this',
          });
          if (direction === 'right') {
            void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
          }
        } catch (error) {
          setDeck((current) => [card, ...current.filter((item) => item.id !== card.id)]);
          setFailedSwipe({ card, direction });
          setErrorMessage(friendlyAuthError(error));
        } finally {
          pendingIdsRef.current.delete(card.id);
          setSubmittingId(null);
        }
      })();
    });
  }, [deck, failedSwipe, queryClient, swipeMutation]);

  const dismissToast = useCallback(() => setToast(emptyToast), []);

  const interactionsDisabled = Boolean(submittingId) || swipeMutation.isPending;

  return {
    deck,
    activeCard,
    nextCards,
    status,
    errorMessage,
    isOffline,
    isRefilling,
    submittingId,
    interactionsDisabled,
    sessionSwipes,
    sessionSaves,
    toast,
    failedSwipe,
    isUndoing: undoMutation.isPending,
    commitSwipe,
    undo,
    retryFailedSwipe,
    dismissToast,
    reload: bootstrap,
    refillDeck,
  };
}
