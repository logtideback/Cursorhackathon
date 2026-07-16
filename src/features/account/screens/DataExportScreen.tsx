import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, FormError, Screen, Text } from '@/components';
import { isEnvConfigured } from '@/lib/env';
import { requestDataExport } from '@/services/account';
import { colors, spacing } from '@/theme';

/** Placeholder data-export request until async export email delivery is wired. */
export function DataExportScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Privacy
      </Text>
      <Text variant="heading">Request your data</Text>
      <Text variant="body" tone="secondary">
        We will prepare a machine-readable summary of your Taste account. Full archive email
        delivery is a placeholder until the export worker ships.
      </Text>

      <View style={styles.panel}>
        <Text variant="caption" tone="secondary">
          Included when available: profile fields, design metadata, collection names, swipe counts,
          and follow relationships. Private collection notes and raw search text are omitted from
          analytics exports and handled carefully in personal exports.
        </Text>
      </View>

      <FormError message={error} />
      {summary ? (
        <Text variant="caption" tone="accent" accessibilityLiveRegion="polite">
          {summary}
        </Text>
      ) : null}

      <Button
        label="Request export"
        loading={busy}
        onPress={() => {
          void (async () => {
            if (!isEnvConfigured()) {
              setError('Data export requires a configured backend.');
              return;
            }
            setBusy(true);
            setError(null);
            try {
              const result = await requestDataExport();
              setSummary(
                `${result.status}: ${result.message}${
                  result.counts
                    ? ` Counts — designs ${result.counts.designs ?? 0}, collections ${result.counts.collections ?? 0}.`
                    : ''
                }`,
              );
              Alert.alert('Export requested', result.message);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not request export.');
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  panel: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
