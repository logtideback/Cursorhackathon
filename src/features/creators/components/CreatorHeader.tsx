import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button, Image, Text } from '@/components';
import type { CreatorProfile } from '@/features/creators/types';
import { colors, radii, spacing } from '@/theme';

type CreatorHeaderProps = {
  profile: CreatorProfile;
  onToggleFollow?: () => void;
  followLoading?: boolean;
};

export function CreatorHeader({
  profile,
  onToggleFollow,
  followLoading = false,
}: CreatorHeaderProps) {
  const displayName = profile.displayName || profile.username || 'Creator';
  const suspended = profile.accountStatus === 'suspended';
  const website = profile.websiteUrl;

  return (
    <View style={styles.root}>
      {profile.avatarUrl ? (
        <Image
          source={{ uri: profile.avatarUrl }}
          style={styles.avatar}
          accessibilityLabel={`${displayName} avatar`}
        />
      ) : (
        <View
          style={[styles.avatar, styles.avatarFallback]}
          accessibilityLabel="Avatar placeholder"
        >
          <Text variant="title" tone="secondary">
            {displayName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.copy}>
        <Text variant="display">{displayName}</Text>
        {profile.username ? (
          <Text variant="body" tone="secondary">
            @{profile.username}
          </Text>
        ) : null}
        {suspended ? (
          <Text variant="caption" tone="danger">
            This account is suspended
          </Text>
        ) : null}
        {profile.bio ? (
          <Text variant="body" tone="secondary" style={styles.bio}>
            {profile.bio}
          </Text>
        ) : null}
        {website && !suspended ? (
          <Pressable
            onPress={() => void Linking.openURL(website)}
            accessibilityRole="link"
            accessibilityLabel={`Open website ${website}`}
          >
            <Text variant="caption" tone="accent">
              {website.replace(/^https?:\/\//, '')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!profile.isSelf && !profile.isBlocking && !profile.isBlockedByThem ? (
        <Button
          label={profile.isFollowing ? 'Following' : 'Follow'}
          variant={profile.isFollowing ? 'secondary' : 'primary'}
          loading={followLoading}
          disabled={suspended || followLoading}
          onPress={onToggleFollow}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: spacing.xs,
  },
  bio: {
    marginTop: spacing.xs,
  },
});
