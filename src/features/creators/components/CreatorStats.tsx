import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, spacing } from '@/theme';

type CreatorStatsProps = {
  followerCount: number;
  followingCount: number;
  publishedDesignCount: number;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <Text variant="subtitle">{value.toLocaleString()}</Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

export function CreatorStats({
  followerCount,
  followingCount,
  publishedDesignCount,
}: CreatorStatsProps) {
  return (
    <View style={styles.row}>
      <Stat value={followerCount} label="Followers" />
      <View style={styles.divider} />
      <Stat value={followingCount} label="Following" />
      <View style={styles.divider} />
      <Stat value={publishedDesignCount} label="Designs" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stat: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});
