import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import type { RecentSearchEntry } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type RecentSearchesProps = {
  entries: RecentSearchEntry[];
  onSelect: (entry: RecentSearchEntry) => void;
  onClearAll: () => void;
};

export function RecentSearches({ entries, onSelect, onClearAll }: RecentSearchesProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.root} accessibilityLabel="Recent searches">
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Recent
        </Text>
        <PressableScale accessibilityLabel="Clear recent searches" onPress={onClearAll}>
          <Text variant="caption" tone="secondary">
            Clear
          </Text>
        </PressableScale>
      </View>
      {entries.map((entry) => (
        <PressableScale
          key={entry.id}
          accessibilityLabel={`Recent search ${entry.query}`}
          onPress={() => onSelect(entry)}
          style={styles.row}
        >
          <Text variant="body">{entry.query}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
