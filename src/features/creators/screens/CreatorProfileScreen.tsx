import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Button,
  Divider,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  Screen,
  Text,
} from '@/components';
import { authApi } from '@/features/auth';
import { CreatorActions } from '@/features/creators/components/CreatorActions';
import { CreatorDesignGrid } from '@/features/creators/components/CreatorDesignGrid';
import { CreatorHeader } from '@/features/creators/components/CreatorHeader';
import { CreatorPublicCollections } from '@/features/creators/components/CreatorPublicCollections';
import { CreatorStats } from '@/features/creators/components/CreatorStats';
import { ProvenanceTransparency } from '@/features/creators/components/ProvenanceTransparency';
import { useCreatorProfile } from '@/features/creators/hooks/useCreatorProfile';
import { ReportCreatorSheet } from '@/features/creators/screens/ReportCreatorSheet';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { hideCreator } from '@/services/preferences';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { spacing } from '@/theme';

type CreatorProfileScreenProps = {
  creatorId: string;
  showAccountActions?: boolean;
};

export function CreatorProfileScreen({
  creatorId,
  showAccountActions = false,
}: CreatorProfileScreenProps) {
  const viewerId = useAuthStore((s) => s.user?.id);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const { profile, isLoading, isError, refetch, followMutation, blockMutation, reportMutation } =
    useCreatorProfile(creatorId, viewerId);

  const [reportVisible, setReportVisible] = useState(false);

  if (isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading creator" />
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen>
        <ErrorState
          title="Could not load profile"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (profile.isBlockedByThem) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          label="Profile"
          title="This profile is unavailable"
          description="You cannot view this creator right now."
        />
      </Screen>
    );
  }

  if (profile.isBlocking) {
    return (
      <Screen contentStyle={styles.content}>
        <CreatorHeader profile={profile} />
        <EmptyState
          label="Blocked"
          title="You blocked this creator"
          description="Their designs stay hidden until you unblock them."
          actionLabel="Unblock"
          onAction={() => {
            void blockMutation.mutateAsync(false);
          }}
        />
        <CreatorActions
          isSelf={false}
          isBlocking
          onReport={() => setReportVisible(true)}
          onBlock={() => undefined}
          onUnblock={() => {
            void blockMutation.mutateAsync(false);
          }}
          blockLoading={blockMutation.isPending}
        />
        <ReportCreatorSheet
          visible={reportVisible}
          creatorId={creatorId}
          onClose={() => setReportVisible(false)}
          onSubmit={(params) => reportMutation.mutateAsync(params)}
        />
      </Screen>
    );
  }

  if (profile.accountStatus === 'suspended') {
    return (
      <Screen contentStyle={styles.content}>
        <CreatorHeader profile={profile} />
        <EmptyState
          label="Suspended"
          title="This creator is suspended"
          description="Their designs and collections are hidden while the account is under review."
        />
        {!profile.isSelf ? (
          <CreatorActions
            isSelf={false}
            isBlocking={false}
            onReport={() => setReportVisible(true)}
            onHide={() => {
              void (async () => {
                if (isEnvConfigured()) {
                  await hideCreator(creatorId);
                }
                track({
                  name: 'creator_hidden',
                  properties: { creatorId, source: 'profile' },
                });
                Alert.alert('Hidden', 'This creator won’t appear in recommendations.');
              })();
            }}
            onBlock={() => {
              void blockMutation.mutateAsync(true).then(() => {
                track({
                  name: 'creator_blocked',
                  properties: { creatorId, source: 'profile' },
                });
              });
            }}
            onUnblock={() => undefined}
            blockLoading={blockMutation.isPending}
          />
        ) : null}
        <ReportCreatorSheet
          visible={reportVisible}
          creatorId={creatorId}
          onClose={() => setReportVisible(false)}
          onSubmit={(params) => reportMutation.mutateAsync(params)}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <CreatorHeader
        profile={profile}
        followLoading={followMutation.isPending}
        onToggleFollow={() => {
          void followMutation.mutateAsync(!profile.isFollowing).then((following) => {
            track({
              name: following ? 'creator_followed' : 'creator_unfollowed',
              properties: { creatorId, source: 'profile' },
            });
          });
        }}
      />

      <CreatorStats
        followerCount={profile.followerCount}
        followingCount={profile.followingCount}
        publishedDesignCount={profile.publishedDesignCount}
      />

      {profile.isSelf ? (
        <View style={styles.selfActions}>
          <Button label="Upload a design" onPress={() => router.push('/upload')} />
        </View>
      ) : null}

      <Divider />

      <View style={styles.section}>
        <Text variant="label" tone="tertiary">
          Published designs
        </Text>
        <CreatorDesignGrid
          designs={profile.designs}
          isSelf={profile.isSelf}
          onEditDesign={(designId) => {
            Alert.alert('Manage design', undefined, [
              {
                text: 'Edit',
                onPress: () => router.push(`/design/${designId}/edit`),
              },
              {
                text: 'Open',
                onPress: () => router.push(`/design/${designId}`),
              },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="label" tone="tertiary">
          Public collections
        </Text>
        <Text variant="caption" tone="tertiary">
          Private collections are never shown on profiles.
        </Text>
        <CreatorPublicCollections collections={profile.publicCollections} isSelf={profile.isSelf} />
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="label" tone="tertiary">
          Provenance transparency
        </Text>
        <ProvenanceTransparency designs={profile.designs} />
      </View>

      {!profile.isSelf ? (
        <>
          <CreatorActions
            isSelf={false}
            isBlocking={false}
            onReport={() => setReportVisible(true)}
            onHide={() => {
              void (async () => {
                if (isEnvConfigured()) {
                  await hideCreator(creatorId);
                }
                track({
                  name: 'creator_hidden',
                  properties: { creatorId, source: 'profile' },
                });
                Alert.alert('Hidden', 'This creator won’t appear in recommendations.');
              })();
            }}
            onBlock={() => {
              void blockMutation.mutateAsync(true).then(() => {
                track({
                  name: 'creator_blocked',
                  properties: { creatorId, source: 'profile' },
                });
              });
            }}
            onUnblock={() => undefined}
            blockLoading={blockMutation.isPending}
          />
          <ReportCreatorSheet
            visible={reportVisible}
            creatorId={creatorId}
            onClose={() => setReportVisible(false)}
            onSubmit={(params) => reportMutation.mutateAsync(params)}
          />
        </>
      ) : null}

      {showAccountActions && profile.isSelf ? (
        <>
          <Divider />
          <View style={styles.selfActions}>
            <Text variant="label" tone="tertiary">
              Account
            </Text>
            <Button
              label="Taste Profile"
              variant="secondary"
              onPress={() => router.push('/settings/taste-profile')}
            />
            <Button label="Settings" variant="secondary" onPress={() => router.push('/settings')} />
            <Button
              label="Sign out"
              variant="secondary"
              onPress={() => {
                void authApi.signOut().then(() => {
                  router.replace('/(auth)');
                });
              }}
            />
            <Button
              label="Replay onboarding"
              variant="ghost"
              onPress={() => {
                resetOnboarding();
                router.replace('/(onboarding)/preferences');
              }}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    gap: spacing.sm,
  },
  selfActions: {
    gap: spacing.sm,
  },
});
