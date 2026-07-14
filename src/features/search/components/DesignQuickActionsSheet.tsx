import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components';
import { ChooseCollectionSheet } from '@/features/collections';
import { shareDesign } from '@/features/designs/detail/share';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import type { SearchDesignHit } from '@/features/search/types';
import { trackEvent } from '@/lib/analytics/track';
import { isEnvConfigured } from '@/lib/env';
import { addDesignToCollection, fetchDefaultCollection } from '@/services/collections';
import { blockCreator, recordDesignFeedback, reportDesign } from '@/services/social';
import { useAuthStore } from '@/store/auth-store';
import { colors, spacing } from '@/theme';

type DesignQuickActionsSheetProps = {
  visible: boolean;
  item: SearchDesignHit | null;
  onClose: () => void;
  onRemovedFromResults?: (designId: string) => void;
};

export function DesignQuickActionsSheet({
  visible,
  item,
  onClose,
  onRemovedFromResults,
}: DesignQuickActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const [busy, setBusy] = useState(false);
  const [chooseVisible, setChooseVisible] = useState(false);

  if (!visible || !item) {
    return null;
  }

  const run = async (action: () => Promise<void>, successMessage?: string) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) {
        Alert.alert('Done', successMessage);
      }
      onClose();
    } catch (error) {
      Alert.alert(
        'Action failed',
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !chooseVisible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Dismiss"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
            <Text variant="label" tone="tertiary">
              Quick actions
            </Text>
            <Text variant="title">{item.title}</Text>
            <View style={styles.actions}>
              <Button
                label="Save"
                variant="secondary"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (isMockDesignId(item.id) || !isEnvConfigured() || !userId) {
                      return;
                    }
                    const saved = await fetchDefaultCollection(userId);
                    if (!saved) {
                      throw new Error('Default Saved collection is missing.');
                    }
                    await addDesignToCollection({
                      collectionId: saved.id,
                      designId: item.id,
                    });
                  }, 'Saved to your Saved collection.')
                }
              />
              <Button
                label="Add to collection"
                variant="secondary"
                onPress={() => setChooseVisible(true)}
              />
              <Button
                label="Share"
                variant="secondary"
                onPress={() =>
                  void run(async () => {
                    await shareDesign({
                      title: item.title,
                      designId: item.id,
                      creatorName: item.creatorName,
                    });
                  })
                }
              />
              <Button
                label="Show me less like this"
                variant="secondary"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (!isMockDesignId(item.id) && isEnvConfigured()) {
                      await recordDesignFeedback({
                        designId: item.id,
                        feedbackType: 'show_less',
                      });
                    }
                    onRemovedFromResults?.(item.id);
                  }, 'We’ll show fewer designs like this.')
                }
              />
              <Button
                label="Hide this creator"
                variant="secondary"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (!isMockDesignId(item.id) && isEnvConfigured()) {
                      await recordDesignFeedback({
                        designId: item.id,
                        feedbackType: 'hide_creator',
                        metadata: { creator_id: item.creatorId },
                      });
                      await blockCreator(item.creatorId).catch(() => undefined);
                    }
                    onRemovedFromResults?.(item.id);
                  }, 'Creator hidden from search and Discover.')
                }
              />
              <Button
                label="Report"
                variant="danger"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (!isMockDesignId(item.id) && isEnvConfigured()) {
                      await reportDesign({
                        designId: item.id,
                        reason: 'other',
                        notes: 'Reported from search quick actions',
                      });
                    }
                    trackEvent('search_result_opened', {
                      design_id: item.id,
                      action: 'report',
                    });
                  }, 'Report submitted.')
                }
              />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </View>
          </View>
        </View>
      </Modal>

      <ChooseCollectionSheet
        visible={chooseVisible}
        designId={item.id}
        designTitle={item.title}
        onClose={() => {
          setChooseVisible(false);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
