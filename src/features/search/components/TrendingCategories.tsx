import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import type { TrendingCategory } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type TrendingCategoriesProps = {
  categories: TrendingCategory[];
  onSelect: (category: TrendingCategory) => void;
};

export function TrendingCategories({ categories, onSelect }: TrendingCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.root} accessibilityLabel="Trending categories">
      <Text variant="label" tone="tertiary">
        Trending categories
      </Text>
      {categories.map((category) => (
        <PressableScale
          key={category.id}
          accessibilityLabel={`${category.name}, ${category.designCount} designs`}
          onPress={() => onSelect(category)}
          style={styles.row}
        >
          <View style={styles.copy}>
            <Text variant="bodyStrong">{category.name}</Text>
            <Text variant="caption" tone="secondary">
              {category.designCount} designs
            </Text>
          </View>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 56,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  copy: {
    gap: spacing.xxs,
  },
});
