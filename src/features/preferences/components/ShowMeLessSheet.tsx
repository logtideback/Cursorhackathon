import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components';
import { defaultTargetsWhenEmpty } from '@/features/preferences/apply-feedback';
import {
  enqueuePreferenceAction,
  flushPreferenceQueue,
} from '@/features/preferences/offline-queue';
import {
  SHOW_ME_LESS_OPTIONS,
  type DesignContextForFeedback,
  type ShowMeLessTarget,
} from '@/features/preferences/types';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { applyShowLessFeedback } from '@/services/preferences';
import { colors, spacing } from '@/theme';

type ShowMeLessSheetProps = {
  visible: boolean;
  design: DesignContextForFeedback | null;
  onClose: () => void;
  onApplied?: (designId: string) => void;
};

export function ShowMeLessSheet({ visible, design, onClose, onApplied }: ShowMeLessSheetProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<ShowMeLessTarget[]>([]);
  const [busy, setBusy] = useState(false);

  if (!visible || !design) {
    return null;
  }

  const toggle = (target: ShowMeLessTarget) => {
    setSelected((current) =>
      current.includes(target) ? current.filter((item) => item !== target) : [...current, target],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text variant="label" tone="tertiary">
              Show me less
            </Text>
            <Text variant="title">What should Taste quiet down?</Text>
            <Text variant="body" tone="secondary">
              Optional. Leave blank to gently downrank this design’s style and tags.
            </Text>

            {SHOW_ME_LESS_OPTIONS.map((option) => {
              const active = selected.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggle(option.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  style={[styles.option, active && styles.optionSelected]}
                >
                  <Text variant="bodyStrong">{option.label}</Text>
                  <Text variant="caption" tone="secondary">
                    {option.body}
                  </Text>
                </Pressable>
              );
            })}

            <Button
              label="Apply"
              loading={busy}
              onPress={() => {
                void (async () => {
                  setBusy(true);
                  const targets = defaultTargetsWhenEmpty(selected);
                  const payload = {
                    designId: design.designId,
                    targets,
                    styleSlugs: design.styleSlugs ?? [],
                    colourFamilies: design.colourFamilies ?? [],
                    layoutPatterns: design.styleSlugs ?? [],
                    categorySlug: design.categorySlug ?? null,
                    tags: design.tags ?? [],
                    creatorId: design.creatorId,
                  };
                  try {
                    if (isEnvConfigured()) {
                      try {
                        await applyShowLessFeedback(payload);
                        await flushPreferenceQueue();
                      } catch {
                        await enqueuePreferenceAction({
                          kind: 'show_less',
                          payload,
                          queuedAt: new Date().toISOString(),
                        });
                      }
                    }
                    track({
                      name: 'show_less_selected',
                      properties: {
                        designId: design.designId,
                        creatorId: design.creatorId,
                        targetCount: targets.length,
                        targets: targets.join(','),
                      },
                    });
                    onApplied?.(design.designId);
                    Alert.alert('Noted', 'We’ll show fewer designs like this.');
                    onClose();
                    setSelected([]);
                  } catch (error) {
                    Alert.alert(
                      'Could not save',
                      error instanceof Error ? error.message : 'Try again shortly.',
                    );
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            />
            <Button label="Cancel" variant="ghost" onPress={onClose} disabled={busy} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 18, 16, 0.35)',
  },
  sheet: {
    backgroundColor: colors.background,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  option: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xxs,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
});
