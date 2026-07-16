import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OfflineBanner, Screen } from '@/components';
import { ChooseCollectionSheet } from '@/features/collections';
import { BatchProgress } from '@/features/discover/components/BatchProgress';
import { DiscoverDeckSkeleton } from '@/features/discover/components/DiscoverDeckSkeleton';
import { DiscoverHeader } from '@/features/discover/components/DiscoverHeader';
import { EmptyDeckState } from '@/features/discover/components/EmptyDeckState';
import { NetworkErrorBanner } from '@/features/discover/components/NetworkErrorBanner';
import { SwipeActions } from '@/features/discover/components/SwipeActions';
import { SwipeDeck, type SwipeDeckHandle } from '@/features/discover/components/SwipeDeck';
import { UndoToast } from '@/features/discover/components/UndoToast';
import { useDiscoverDeck } from '@/features/discover/hooks/useDiscoverDeck';
import type { DiscoverCard } from '@/features/discover/types';
import { DesignFeedbackActionsSheet } from '@/features/preferences';
import type { DesignContextForFeedback } from '@/features/preferences/types';
import { spacing } from '@/theme';
import type { SwipeDirection } from '@/types/database';

function toFeedbackContext(card: DiscoverCard): DesignContextForFeedback {
  return {
    designId: card.id,
    title: card.title,
    creatorId: card.creatorId,
    creatorName: card.creatorName,
    categorySlug: card.category,
    tags: card.tags,
    styleSlugs: card.tags,
  };
}

export default function DiscoverScreen() {
  const deckRef = useRef<SwipeDeckHandle>(null);
  const {
    activeCard,
    nextCards,
    status,
    errorMessage,
    isOffline,
    interactionsDisabled,
    sessionSwipes,
    sessionSaves,
    toast,
    failedSwipe,
    isUndoing,
    commitSwipe,
    undo,
    retryFailedSwipe,
    dismissToast,
    reload,
  } = useDiscoverDeck();

  const [organiseDesignId, setOrganiseDesignId] = useState<string | null>(null);
  const [organiseTitle, setOrganiseTitle] = useState<string | null>(null);
  const [feedbackDesign, setFeedbackDesign] = useState<DesignContextForFeedback | null>(null);

  const onSwipe = useCallback(
    (direction: SwipeDirection) => {
      void commitSwipe(direction);
    },
    [commitSwipe],
  );

  const onOpenDetail = useCallback((card: DiscoverCard) => {
    router.push(`/design/${card.id}`);
  }, []);

  const onPass = useCallback(() => {
    deckRef.current?.swipe('left');
  }, []);

  const onSave = useCallback(() => {
    deckRef.current?.swipe('right');
  }, []);

  const onOrganise = useCallback(() => {
    if (!toast.designId) {
      return;
    }
    setOrganiseDesignId(toast.designId);
    setOrganiseTitle(toast.title);
    dismissToast();
  }, [dismissToast, toast.designId, toast.title]);

  return (
    <Screen edges={['top', 'left', 'right']} contentStyle={styles.content}>
      <View style={styles.top}>
        <DiscoverHeader />
        <BatchProgress considered={sessionSwipes} saved={sessionSaves} />
      </View>

      {isOffline ? (
        <OfflineBanner
          message="Swipes will retry when you reconnect."
          actionLabel="Reload"
          onAction={() => void reload()}
        />
      ) : null}

      {errorMessage && !failedSwipe ? (
        <NetworkErrorBanner message={errorMessage} onAction={() => void reload()} />
      ) : null}

      {failedSwipe ? (
        <NetworkErrorBanner
          message={errorMessage ?? 'Could not save that swipe.'}
          actionLabel="Retry swipe"
          onAction={() => void retryFailedSwipe()}
        />
      ) : null}

      <View style={styles.deckArea}>
        {status === 'loading' ? <DiscoverDeckSkeleton /> : null}

        {status === 'error' && !activeCard ? (
          <NetworkErrorBanner
            message={errorMessage ?? 'Could not load designs.'}
            onAction={() => void reload()}
          />
        ) : null}

        {status === 'empty' && !activeCard ? (
          <EmptyDeckState offline={isOffline} onRefresh={() => void reload()} />
        ) : null}

        {activeCard ? (
          <SwipeDeck
            ref={deckRef}
            activeCard={activeCard}
            nextCard={nextCards[0] ?? null}
            disabled={interactionsDisabled}
            onSwipe={onSwipe}
            onOpenDetail={onOpenDetail}
            onLongPressCard={(card) => setFeedbackDesign(toFeedbackContext(card))}
          />
        ) : null}
      </View>

      {activeCard ? (
        <SwipeActions
          disabled={interactionsDisabled}
          onPass={onPass}
          onSave={onSave}
          onUndo={() => void undo()}
          canUndo={sessionSwipes > 0}
          onMore={() => setFeedbackDesign(toFeedbackContext(activeCard))}
        />
      ) : null}

      <UndoToast
        toast={toast}
        undoing={isUndoing}
        onUndo={() => void undo()}
        onDismiss={dismissToast}
        onMoveToCollection={onOrganise}
      />

      <ChooseCollectionSheet
        visible={Boolean(organiseDesignId)}
        designId={organiseDesignId}
        designTitle={organiseTitle}
        onClose={() => {
          setOrganiseDesignId(null);
          setOrganiseTitle(null);
        }}
      />

      <DesignFeedbackActionsSheet
        visible={Boolean(feedbackDesign)}
        design={feedbackDesign}
        onClose={() => setFeedbackDesign(null)}
        onRemoved={() => {
          setFeedbackDesign(null);
          deckRef.current?.swipe('left');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  top: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  deckArea: {
    flex: 1,
    minHeight: 360,
  },
});
