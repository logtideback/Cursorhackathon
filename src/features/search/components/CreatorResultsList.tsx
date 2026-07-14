import { StyleSheet, View } from 'react-native';

import { Button, Image, PressableScale, Text } from '@/components';
import type { SearchCreatorHit } from '@/features/search/types';
import { colors, radii, spacing } from '@/theme';

type CreatorResultsListProps = {
  items: SearchCreatorHit[];
  onPress: (item: SearchCreatorHit) => void;
  onFilterToCreator?: (item: SearchCreatorHit) => void;
};

export function CreatorResultsList({ items, onPress, onFilterToCreator }: CreatorResultsListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const name = item.displayName ?? item.username ?? 'Creator';
        return (
          <View key={item.id} style={styles.row}>
            <PressableScale
              accessibilityLabel={`${name}, ${item.publishedDesignCount} designs`}
              onPress={() => onPress(item)}
              style={styles.identity}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text variant="bodyStrong" tone="secondary">
                    {name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.copy}>
                <Text variant="bodyStrong">{name}</Text>
                <Text variant="caption" tone="secondary">
                  {item.username ? `@${item.username}` : 'Creator'} · {item.publishedDesignCount}{' '}
                  designs
                </Text>
              </View>
            </PressableScale>
            {onFilterToCreator ? (
              <Button
                label="Filter"
                variant="ghost"
                fullWidth={false}
                onPress={() => onFilterToCreator(item)}
                accessibilityHint="Filter design results to this creator"
                style={styles.filter}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  filter: {
    minWidth: 72,
  },
});
