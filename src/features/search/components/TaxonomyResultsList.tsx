import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import type { SearchTaxonomyHit } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type TaxonomyResultsListProps = {
  items: SearchTaxonomyHit[];
  onPress: (item: SearchTaxonomyHit) => void;
};

export function TaxonomyResultsList({ items, onPress }: TaxonomyResultsListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <PressableScale
          key={`${item.kind}-${item.id}`}
          accessibilityLabel={`${item.label} ${item.kind}`}
          onPress={() => onPress(item)}
          style={styles.row}
        >
          <Text variant="label" tone="tertiary">
            {item.kind}
          </Text>
          <Text variant="bodyStrong">{item.label}</Text>
          {item.meta ? (
            <Text variant="caption" tone="secondary" numberOfLines={2}>
              {item.meta}
            </Text>
          ) : null}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    minHeight: 64,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
