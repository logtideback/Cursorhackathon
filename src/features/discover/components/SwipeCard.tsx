import { StyleSheet, View } from 'react-native';

import { Image } from '@/components/ui/Image';
import { Text } from '@/components/ui/Text';
import type { DiscoverCard } from '@/features/discover/types';
import { colors, radii, spacing } from '@/theme';

type SwipeCardProps = {
  card: DiscoverCard;
  dimmed?: boolean;
};

export function SwipeCard({ card, dimmed = false }: SwipeCardProps) {
  return (
    <View
      style={[styles.root, dimmed && styles.dimmed]}
      accessibilityLabel={`${card.title} by ${card.creatorName}. Double tap to open details.`}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          recyclingKey={card.id}
          priority="high"
          transition={180}
        />
        <View style={styles.tapHint} accessibilityElementsHidden>
          <Text variant="label" tone="inverse" style={styles.tapHintText}>
            View
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text variant="label" tone="tertiary">
          {[card.category, card.platform].filter(Boolean).join(' · ') || 'Design'}
        </Text>
        <Text variant="title" numberOfLines={2}>
          {card.title}
        </Text>
        <Text variant="body" tone="secondary" numberOfLines={1}>
          {card.creatorName}
        </Text>
        <View style={styles.footer}>
          <View style={styles.tags}>
            {card.tags.slice(0, 3).map((tag) => (
              <Text key={tag} variant="caption" tone="tertiary" style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
          <Text variant="caption" tone="secondary">
            {card.saveCount} saves
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dimmed: {
    opacity: 0.92,
  },
  imageWrap: {
    flex: 1,
    minHeight: 280,
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  tapHint: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(18,18,18,0.45)',
  },
  tapHintText: {
    color: colors.textInverse,
    letterSpacing: 1.4,
  },
  meta: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    textTransform: 'none',
    letterSpacing: 0.2,
  },
});
