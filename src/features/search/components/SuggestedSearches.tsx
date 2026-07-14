import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import { SUGGESTED_SEARCHES } from '@/features/search/constants';
import { colors, spacing } from '@/theme';

type SuggestedSearchesProps = {
  onSelect: (query: string) => void;
};

export function SuggestedSearches({ onSelect }: SuggestedSearchesProps) {
  return (
    <View style={styles.root} accessibilityLabel="Suggested searches">
      <Text variant="label" tone="tertiary">
        Suggested
      </Text>
      {SUGGESTED_SEARCHES.map((query) => (
        <PressableScale
          key={query}
          accessibilityLabel={`Suggested search ${query}`}
          onPress={() => onSelect(query)}
          style={styles.row}
        >
          <Text variant="body">{query}</Text>
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
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
