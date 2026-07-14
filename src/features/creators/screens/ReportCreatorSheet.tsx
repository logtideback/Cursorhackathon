import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components';
import { REPORT_REASON_OPTIONS } from '@/features/designs/detail/constants';
import { track } from '@/lib/analytics';
import { colors, spacing } from '@/theme';
import type { ReportReason } from '@/types/database';

type ReportCreatorSheetProps = {
  visible: boolean;
  creatorId: string;
  onClose: () => void;
  onSubmit: (params: { reason: ReportReason; notes?: string | null }) => Promise<unknown>;
};

function ReportCreatorBody({
  creatorId,
  onClose,
  onSubmit,
}: Omit<ReportCreatorSheetProps, 'visible'>) {
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
        <Text variant="title">Why are you reporting this creator?</Text>
        <Text variant="body" tone="secondary">
          Reports are private. Moderators review them before taking action.
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
              await onSubmit({ reason, notes: notes.trim() || null });
              track({
                name: 'report_submitted',
                properties: { targetType: 'creator', targetId: creatorId, reason },
              });
              Alert.alert('Report submitted', 'Thanks — our team will review this profile.');
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not submit report.');
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

export function ReportCreatorSheet({
  visible,
  creatorId,
  onClose,
  onSubmit,
}: ReportCreatorSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        {visible ? (
          <ReportCreatorBody creatorId={creatorId} onClose={onClose} onSubmit={onSubmit} />
        ) : null}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
