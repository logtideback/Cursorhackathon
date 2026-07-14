import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import { useTheme } from '@/providers/ThemeProvider';
import { colors, spacing } from '@/theme';

const OPTIONS = [
  { id: 'light' as const, label: 'Light', body: 'Editorial paper canvas (recommended).' },
  {
    id: 'dark' as const,
    label: 'Dark',
    body: 'Charcoal canvas. Some screens still use paper cards.',
  },
  { id: 'system' as const, label: 'System', body: 'Follow the device appearance setting.' },
];

/** Quiet appearance control — no gradients, no icon rows. */
export function AppearancePreferenceCard() {
  const { preference, setPreference } = useTheme();

  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
      <Text variant="subtitle">Appearance</Text>
      <Text variant="caption" tone="secondary">
        Taste is designed for a light editorial canvas. Dark mode is available and still shipping
        screen-by-screen.
      </Text>
      {OPTIONS.map((option) => {
        const selected = preference === option.id;
        return (
          <PressableScale
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.body}
            onPress={() => setPreference(option.id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text variant="bodyStrong">{option.label}</Text>
            <Text variant="caption" tone="secondary">
              {option.body}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  option: {
    minHeight: 44,
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
