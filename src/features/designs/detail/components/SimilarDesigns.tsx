import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { EmptyState, Image, LoadingIndicator, PressableScale, Text } from '@/components';
import type { SimilarDesignCard } from '@/features/designs/detail/types';
import { colors, spacing } from '@/theme';

type SimilarDesignsProps = {
  designs: SimilarDesignCard[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

export function SimilarDesigns({ designs, loading, error, onRetry }: SimilarDesignsProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;

  return (
    <View style={styles.root} accessibilityLabel="Similar designs">
      <Text variant="label" tone="tertiary">
        Similar designs
      </Text>

      {loading ? <LoadingIndicator label="Finding related work" /> : null}

      {!loading && error ? (
        <EmptyState
          label="Similar"
          title="Couldn’t load related designs"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={onRetry}
        />
      ) : null}

      {!loading && !error && designs.length === 0 ? (
        <EmptyState
          label="Similar"
          title="Nothing similar yet"
          description="Taste will surface related work as more designs land in your taste graph."
        />
      ) : null}

      {!loading && !error && designs.length > 0 ? (
        <View style={styles.grid}>
          {designs.map((design) => (
            <PressableScale
              key={design.id}
              accessibilityLabel={`${design.title} by ${design.creatorName}`}
              accessibilityHint="Opens design detail"
              onPress={() => router.push(`/design/${design.id}`)}
              style={[styles.cell, { width: columnWidth }]}
            >
              {design.imageUrl ? (
                <Image
                  source={{ uri: design.thumbnailUrl ?? design.imageUrl }}
                  style={[styles.image, { width: columnWidth, height: columnWidth * 1.25 }]}
                  accessibilityLabel={design.title}
                  recyclingKey={design.id}
                />
              ) : (
                <View
                  style={[
                    styles.image,
                    styles.imageFallback,
                    { width: columnWidth, height: columnWidth * 1.25 },
                  ]}
                >
                  <Text variant="caption" tone="secondary">
                    No image
                  </Text>
                </View>
              )}
              <Text variant="caption" numberOfLines={2} style={styles.title}>
                {design.title}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    gap: spacing.xs,
  },
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    paddingTop: spacing.xs,
  },
});
