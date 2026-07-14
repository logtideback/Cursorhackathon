import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Image, PressableScale, Text } from '@/components';
import { MIN_TOUCH_TARGET } from '@/features/designs/detail/constants';
import type { DesignCreatorSummary } from '@/features/designs/detail/types';
import { colors, radii, spacing } from '@/theme';

type CreatorSummaryProps = {
  creator: DesignCreatorSummary;
  onToggleFollow: () => void;
  followLoading?: boolean;
};

export function CreatorSummary({
  creator,
  onToggleFollow,
  followLoading = false,
}: CreatorSummaryProps) {
  const suspended = creator.accountStatus === 'suspended';
  const subtitle = creator.username ? `@${creator.username}` : 'Creator';

  return (
    <View style={styles.root}>
      <PressableScale
        accessibilityLabel={`Open profile for ${creator.displayName}`}
        accessibilityHint="Navigates to creator profile"
        disabled={suspended}
        onPress={() => router.push(`/creator/${creator.id}`)}
        style={styles.identity}
      >
        {creator.avatarUrl ? (
          <Image
            source={{ uri: creator.avatarUrl }}
            style={styles.avatar}
            accessibilityLabel={`${creator.displayName} avatar`}
          />
        ) : (
          <View
            style={[styles.avatar, styles.avatarFallback]}
            accessibilityLabel={`${creator.displayName} avatar placeholder`}
          >
            <Text variant="bodyStrong" tone="secondary">
              {creator.displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.copy}>
          <Text variant="subtitle">{creator.displayName}</Text>
          <Text variant="caption" tone="secondary">
            {suspended ? 'Account suspended' : subtitle}
          </Text>
          <Text variant="caption" tone="tertiary">
            {creator.publishedDesignCount} published{' '}
            {creator.publishedDesignCount === 1 ? 'design' : 'designs'}
          </Text>
        </View>
      </PressableScale>

      {!creator.isSelf ? (
        <Button
          label={creator.isFollowing ? 'Following' : 'Follow'}
          variant={creator.isFollowing ? 'secondary' : 'primary'}
          fullWidth={false}
          loading={followLoading}
          disabled={suspended || followLoading}
          onPress={onToggleFollow}
          accessibilityHint={
            suspended
              ? 'Follow unavailable for suspended creators'
              : creator.isFollowing
                ? 'Unfollow this creator'
                : 'Follow this creator'
          }
          style={styles.follow}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
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
  follow: {
    minWidth: 112,
    paddingHorizontal: spacing.lg,
  },
});
