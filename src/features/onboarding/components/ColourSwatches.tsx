import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { COLOUR_FAMILIES } from '@/features/onboarding/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, radii, spacing } from '@/theme';

type Props = {
  selected: string[];
  onToggle: (id: string) => void;
};

export function ColourSwatches({ selected, onToggle }: Props) {
  const { haptic } = useHaptics();

  return (
    <View style={styles.grid}>
      {COLOUR_FAMILIES.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <PressableScale
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${option.label} colour family`}
            onPress={() => {
              haptic('selection');
              onToggle(option.id);
            }}
            style={styles.item}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: option.swatch },
                isSelected && styles.swatchSelected,
              ]}
            />
            <Text variant="caption" tone={isSelected ? 'accent' : 'secondary'}>
              {option.label}
            </Text>
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
    gap: spacing.lg,
  },
  item: {
    width: '21%',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 72,
  },
  swatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  swatchSelected: {
    borderColor: colors.text,
    borderWidth: 2,
  },
});
