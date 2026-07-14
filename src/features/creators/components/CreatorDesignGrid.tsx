import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { EmptyState, Image, PressableScale, Text } from '@/components';
import type { CreatorDesignCard } from '@/features/creators/types';
import { PROVENANCE_LABELS } from '@/features/designs/detail/constants';
import { colors, radii, spacing } from '@/theme';

type CreatorDesignGridProps = {
  designs: CreatorDesignCard[];
  isSelf?: boolean;
  onEditDesign?: (designId: string) => void;
};

export function CreatorDesignGrid({
  designs,
  isSelf = false,
  onEditDesign,
}: CreatorDesignGridProps) {
  const { width } = useWindowDimensions();
  const gap = spacing.sm;
  const horizontalPad = spacing.lg * 2;
  const tileWidth = Math.floor((width - horizontalPad - gap) / 2);

  if (designs.length === 0) {
    return (
      <EmptyState
        label="Designs"
        title={isSelf ? 'No published designs yet' : 'No designs to show'}
        description={
          isSelf
            ? 'Upload your first design to start building your Taste profile.'
            : 'This creator has not published any designs yet.'
        }
        actionLabel={isSelf ? 'Upload a design' : undefined}
        onAction={isSelf ? () => router.push('/upload') : undefined}
      />
    );
  }

  return (
    <View style={styles.grid}>
      {designs.map((design) => {
        const uri = design.thumbnailUrl || design.imageUrl;
        return (
          <PressableScale
            key={design.id}
            style={[styles.tile, { width: tileWidth }]}
            accessibilityLabel={`${design.title}, ${PROVENANCE_LABELS[design.provenance]}`}
            onPress={() => router.push(`/design/${design.id}`)}
            onLongPress={isSelf && onEditDesign ? () => onEditDesign(design.id) : undefined}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={[styles.image, styles.placeholder]} />
            )}
            <Text variant="caption" numberOfLines={1}>
              {design.title}
            </Text>
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {PROVENANCE_LABELS[design.provenance]}
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
    gap: spacing.sm,
  },
  tile: {
    gap: spacing.xxs,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
