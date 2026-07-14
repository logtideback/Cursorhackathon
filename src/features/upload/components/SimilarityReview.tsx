import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { SIMILARITY_REVIEW_COPY } from '@/features/upload/constants';
import type { SimilarDesignResult } from '@/features/upload/types';
import { colors, radii, spacing } from '@/theme';

type SimilarityReviewProps = {
  results: SimilarDesignResult[];
};

export function SimilarityReview({ results }: SimilarityReviewProps) {
  if (results.length === 0) {
    return (
      <Text variant="body" tone="secondary">
        No close visual neighbours turned up in this check. You can publish when ready.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      <Text variant="body" tone="secondary">
        {SIMILARITY_REVIEW_COPY}
      </Text>
      {results.map((item) => (
        <View key={item.designId} style={styles.row}>
          <View style={styles.swatch} />
          <View style={styles.copy}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption" tone="secondary">
              {item.creatorDisplayName ?? 'Creator'} · similarity {Math.round(item.score * 100)}%
            </Text>
          </View>
        </View>
      ))}
      <Text variant="caption" tone="tertiary">
        This list is informational. It does not mean your work was copied.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  swatch: {
    width: 56,
    height: 70,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
