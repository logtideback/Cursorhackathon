import { StyleSheet, Switch, View } from 'react-native';

import { Button, Text } from '@/components';
import { track, useAnalyticsConsentStore } from '@/lib/analytics';
import { colors, spacing } from '@/theme';

type AnalyticsConsentCardProps = {
  compact?: boolean;
};

export function AnalyticsConsentCard({ compact = false }: AnalyticsConsentCardProps) {
  const consentGranted = useAnalyticsConsentStore((s) => s.consentGranted);
  const analyticsEnabled = useAnalyticsConsentStore((s) => s.analyticsEnabled);
  const setConsent = useAnalyticsConsentStore((s) => s.setConsent);
  const setAnalyticsEnabled = useAnalyticsConsentStore((s) => s.setAnalyticsEnabled);

  const updateConsent = (granted: boolean) => {
    setConsent(granted);
    track({
      name: 'analytics_consent_updated',
      properties: { granted, source: compact ? 'settings' : 'prompt' },
    });
  };

  return (
    <View style={styles.root}>
      {!compact ? (
        <>
          <Text variant="label" tone="tertiary">
            Privacy
          </Text>
          <Text variant="title">Help Taste improve</Text>
          <Text variant="body" tone="secondary">
            We use privacy-safe product analytics to understand which recommendations sharpen your
            eye. We never log passwords, private collection notes, or raw search text.
          </Text>
        </>
      ) : (
        <Text variant="subtitle">Product analytics</Text>
      )}

      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="bodyStrong">Allow analytics</Text>
          <Text variant="caption" tone="secondary">
            {consentGranted === null
              ? 'Choose whether Taste may send anonymised usage events.'
              : consentGranted
                ? 'Events are sent with your consent.'
                : 'Analytics is off. You can change this anytime.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Allow analytics"
          value={Boolean(analyticsEnabled && consentGranted)}
          onValueChange={(value) => {
            updateConsent(value);
            setAnalyticsEnabled(value);
          }}
        />
      </View>

      {!compact && consentGranted === null ? (
        <View style={styles.actions}>
          <Button label="Allow analytics" onPress={() => updateConsent(true)} />
          <Button label="Not now" variant="ghost" onPress={() => updateConsent(false)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    gap: spacing.sm,
  },
  border: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
