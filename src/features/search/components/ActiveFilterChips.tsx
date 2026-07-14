import { ScrollView, StyleSheet } from 'react-native';

import { PressableScale, Text } from '@/components';
import type { ActiveFilterChip } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
  onClearChip: (chip: ActiveFilterChip) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({ chips, onClearChip, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Active filters"
    >
      {chips.map((chip) => (
        <PressableScale
          key={chip.key}
          accessibilityLabel={`Clear filter ${chip.label}`}
          onPress={() => onClearChip(chip)}
          style={styles.chip}
        >
          <Text variant="caption">{chip.label} ×</Text>
        </PressableScale>
      ))}
      <PressableScale
        accessibilityLabel="Clear all filters"
        onPress={onClearAll}
        style={styles.clearAll}
      >
        <Text variant="caption" tone="secondary">
          Clear all
        </Text>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  clearAll: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
