import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, FormError, Screen, Text, TextField } from '@/components';
import { REPORT_REASON_OPTIONS } from '@/features/designs/detail/constants';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { reportCreator } from '@/services/creators';
import { reportDesign } from '@/services/social';
import { colors, spacing } from '@/theme';
import type { ReportReason } from '@/types/database';

/**
 * Full-screen report flow for designs or creators.
 * Deep link / navigate with `?designId=` or `?creatorId=`.
 */
export function ReportScreen() {
  const params = useLocalSearchParams<{ designId?: string; creatorId?: string }>();
  const designId = typeof params.designId === 'string' ? params.designId : undefined;
  const creatorId = typeof params.creatorId === 'string' ? params.creatorId : undefined;
  const targetKind = designId ? 'design' : creatorId ? 'creator' : null;

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!targetKind) {
    return (
      <Screen contentStyle={styles.content}>
        <Text variant="heading">Report</Text>
        <Text variant="body" tone="secondary">
          Open report from a design or creator profile, or pass a designId / creatorId.
        </Text>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Safety
      </Text>
      <Text variant="heading" accessibilityRole="header">
        {targetKind === 'design' ? 'Report design' : 'Report creator'}
      </Text>
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
              accessibilityRole="radio"
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

      <FormError message={error} />

      <Button
        label="Submit report"
        loading={busy}
        disabled={!reason}
        onPress={() => {
          void (async () => {
            if (!reason) {
              setError('Choose a reason to continue.');
              return;
            }
            setBusy(true);
            setError(null);
            try {
              if (targetKind === 'design' && designId) {
                if (isMockDesignId(designId) || !isEnvConfigured()) {
                  track({
                    name: 'report_submitted',
                    properties: { targetType: 'design', targetId: designId, reason },
                  });
                } else {
                  await reportDesign({
                    designId,
                    reason,
                    notes: notes.trim() || null,
                  });
                  track({
                    name: 'report_submitted',
                    properties: { targetType: 'design', targetId: designId, reason },
                  });
                }
              } else if (creatorId) {
                if (!isEnvConfigured()) {
                  track({
                    name: 'report_submitted',
                    properties: { targetType: 'creator', targetId: creatorId, reason },
                  });
                } else {
                  await reportCreator({
                    creatorId,
                    reason,
                    notes: notes.trim() || null,
                  });
                  track({
                    name: 'report_submitted',
                    properties: { targetType: 'creator', targetId: creatorId, reason },
                  });
                }
              }
              Alert.alert('Report submitted', 'Thanks — our team will review this.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not submit this report.');
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
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
