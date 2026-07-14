import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components';
import { REPORT_REASON_OPTIONS } from '@/features/designs/detail/constants';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import { trackEvent } from '@/lib/analytics/track';
import { isEnvConfigured } from '@/lib/env';
import { reportDesign } from '@/services/social';
import { colors, spacing } from '@/theme';
import type { ReportReason } from '@/types/database';

type ReportSheetProps = {
  visible: boolean;
  designId: string;
  onClose: () => void;
};

function ReportSheetBody({ designId, onClose }: Omit<ReportSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="label" tone="tertiary">
          Report
        </Text>
        <Text variant="title">What is wrong with this design?</Text>
        <Text variant="body" tone="secondary">
          Reports are private. Choose the closest reason so moderation can review quickly.
        </Text>

        <View style={styles.list}>
          {REPORT_REASON_OPTIONS.map((option) => {
            const selected = reason === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setReason(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text variant="bodyStrong">{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="Optional details"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add context if it helps"
          multiline
          numberOfLines={3}
          inputStyle={styles.notes}
        />

        {error ? (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button
          label="Submit report"
          loading={busy}
          disabled={!reason}
          onPress={async () => {
            if (!reason) {
              setError('Choose a reason to continue.');
              return;
            }
            setBusy(true);
            setError(null);
            try {
              if (isMockDesignId(designId) || !isEnvConfigured()) {
                trackEvent('design_reported', {
                  design_id: designId,
                  reason,
                  mock: true,
                });
              } else {
                await reportDesign({
                  designId,
                  reason,
                  notes: notes.trim() || null,
                });
                trackEvent('design_reported', {
                  design_id: designId,
                  reason,
                });
              }
              Alert.alert('Report submitted', 'Thanks — our team will review this design.');
              onClose();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Could not submit this report.';
              setError(message);
              Alert.alert('Report failed', message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button label="Cancel" variant="ghost" onPress={onClose} disabled={busy} />
      </ScrollView>
    </View>
  );
}

export function ReportSheet({ visible, designId, onClose }: ReportSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss report sheet"
        />
        {visible ? <ReportSheetBody key={designId} designId={designId} onClose={onClose} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
