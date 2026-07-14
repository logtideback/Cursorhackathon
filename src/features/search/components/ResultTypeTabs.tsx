import { ScrollView, StyleSheet } from 'react-native';

import { PressableScale, Text } from '@/components';
import { RESULT_TYPE_LABELS, type SearchResultType } from '@/features/search/constants';
import { colors, spacing } from '@/theme';

const TYPES: SearchResultType[] = [
  'designs',
  'creators',
  'categories',
  'tags',
  'industries',
  'platforms',
];

type ResultTypeTabsProps = {
  value: SearchResultType;
  onChange: (value: SearchResultType) => void;
};

export function ResultTypeTabs({ value, onChange }: ResultTypeTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Result types"
    >
      {TYPES.map((type) => {
        const selected = type === value;
        return (
          <PressableScale
            key={type}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={RESULT_TYPE_LABELS[type]}
            onPress={() => onChange(type)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text variant="caption" tone={selected ? 'inverse' : 'secondary'}>
              {RESULT_TYPE_LABELS[type]}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tab: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  tabSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
