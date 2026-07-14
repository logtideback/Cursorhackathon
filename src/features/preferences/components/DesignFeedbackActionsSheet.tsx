import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components';
import { ChooseCollectionSheet } from '@/features/collections';
import { shareDesign } from '@/features/designs/detail/share';
import { ShowMeLessSheet } from '@/features/preferences/components/ShowMeLessSheet';
import {
  enqueuePreferenceAction,
  flushPreferenceQueue,
} from '@/features/preferences/offline-queue';
import type { DesignContextForFeedback } from '@/features/preferences/types';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { hideCreator } from '@/services/preferences';
import { blockCreator } from '@/services/social';
import { colors, spacing } from '@/theme';

type DesignFeedbackActionsSheetProps = {
  visible: boolean;
  design: DesignContextForFeedback | null;
  onClose: () => void;
  onRemoved?: (designId: string) => void;
};

export function DesignFeedbackActionsSheet({
  visible,
  design,
  onClose,
  onRemoved,
}: DesignFeedbackActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [showLessVisible, setShowLessVisible] = useState(false);
  const [chooseVisible, setChooseVisible] = useState(false);

  if (!visible || !design) {
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
        visible={visible && !showLessVisible && !chooseVisible}
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
              Feedback
            </Text>
            <Text variant="title">{design.title}</Text>
            <View style={styles.actions}>
              <Button
                label="Show me less like this"
                variant="secondary"
                onPress={() => setShowLessVisible(true)}
              />
              <Button
                label="Hide creator"
                variant="secondary"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (isEnvConfigured()) {
                      try {
                        await hideCreator(design.creatorId);
                        await flushPreferenceQueue();
                      } catch {
                        await enqueuePreferenceAction({
                          kind: 'hide_creator',
                          creatorId: design.creatorId,
                          designId: design.designId,
                          queuedAt: new Date().toISOString(),
                        });
                      }
                    }
                    track({
                      name: 'creator_hidden',
                      properties: { creatorId: design.creatorId, source: 'detail' },
                    });
                    onRemoved?.(design.designId);
                  }, 'Creator hidden from recommendations. They are not blocked.')
                }
              />
              <Button
                label="Block creator"
                variant="secondary"
                loading={busy}
                onPress={() => {
                  Alert.alert(
                    'Block this creator?',
                    'You will hide each other where appropriate. You can reverse this in Settings.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Block',
                        style: 'destructive',
                        onPress: () =>
                          void run(async () => {
                            if (isEnvConfigured()) {
                              try {
                                await blockCreator(design.creatorId);
                                await flushPreferenceQueue();
                              } catch {
                                await enqueuePreferenceAction({
                                  kind: 'block_creator',
                                  creatorId: design.creatorId,
                                  queuedAt: new Date().toISOString(),
                                });
                              }
                            }
                            track({
                              name: 'creator_blocked',
                              properties: { creatorId: design.creatorId, source: 'detail' },
                            });
                            onRemoved?.(design.designId);
                          }, 'Creator blocked.'),
                      },
                    ],
                  );
                }}
              />
              <Button
                label="Save to collection"
                variant="secondary"
                onPress={() => setChooseVisible(true)}
              />
              <Button
                label="Share"
                variant="ghost"
                onPress={() =>
                  void run(async () => {
                    await shareDesign({
                      title: design.title,
                      designId: design.designId,
                      creatorId: design.creatorId,
                      creatorName: design.creatorName,
                    });
                  })
                }
              />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </View>
          </View>
        </View>
      </Modal>

      <ShowMeLessSheet
        visible={showLessVisible}
        design={design}
        onClose={() => {
          setShowLessVisible(false);
          onClose();
        }}
        onApplied={(designId) => onRemoved?.(designId)}
      />

      <ChooseCollectionSheet
        visible={chooseVisible}
        designId={design.designId}
        designTitle={design.title}
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
    backgroundColor: colors.overlay ?? 'rgba(20, 18, 16, 0.35)',
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
