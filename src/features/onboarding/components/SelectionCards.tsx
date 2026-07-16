import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { PreferenceOption } from '@/features/onboarding/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, radii, spacing } from '@/theme';

type Props = {
  options: PreferenceOption[];
  selected: string[];
  onToggle: (id: string) => void;
};

/** Quiet selection cards for industries and categories. */
export function SelectionCards({ options, selected, onToggle }: Props) {
  const { haptic } = useHaptics();

  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <PressableScale
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => {
              haptic('selection');
              onToggle(option.id);
            }}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <View style={styles.copy}>
              <Text variant="bodyStrong" tone={isSelected ? 'accent' : 'primary'}>
                {option.label}
              </Text>
              {option.subtitle ? (
                <Text variant="caption" tone="secondary">
                  {option.subtitle}
                </Text>
              ) : null}
            </View>
            <View style={[styles.mark, isSelected && styles.markSelected]} />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  mark: {
    width: 14,
    height: 14,
    borderRadius: radii.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  markSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
