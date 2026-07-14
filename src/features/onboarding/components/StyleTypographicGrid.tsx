import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { PreferenceOption } from '@/features/onboarding/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, fontFamilies, radii, spacing } from '@/theme';

type Props = {
  options: PreferenceOption[];
  selected: string[];
  onToggle: (id: string) => void;
};

/** Large typographic tiles for design styles. */
export function StyleTypographicGrid({ options, selected, onToggle }: Props) {
  const { haptic } = useHaptics();

  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <PressableScale
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${option.label} style`}
            onPress={() => {
              haptic('selection');
              onToggle(option.id);
            }}
            style={[styles.tile, isSelected && styles.tileSelected]}
          >
            <Text style={[styles.letter, isSelected && styles.letterSelected]} numberOfLines={1}>
              {option.label.slice(0, 1)}
            </Text>
            <Text variant="bodyStrong" tone={isSelected ? 'inverse' : 'primary'}>
              {option.label}
            </Text>
            {option.subtitle ? (
              <Text variant="caption" tone={isSelected ? 'inverse' : 'tertiary'}>
                {option.subtitle}
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48%',
    minHeight: 112,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: 'flex-end',
    gap: spacing.xxs,
  },
  tileSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  letter: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    fontFamily: fontFamilies.display,
    fontSize: 42,
    lineHeight: 44,
    color: colors.borderStrong,
  },
  letterSelected: {
    color: colors.accentMuted,
  },
});
