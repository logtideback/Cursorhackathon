import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { isEnvConfigured } from '@/lib/env';
import { fetchPreferenceControls, getMockPreferenceControls } from '@/services/preferences';
import { unblockCreator } from '@/services/social';
import { colors, spacing } from '@/theme';

/** Dedicated blocked-creators management screen. */
export function BlockedUsersScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['preference-controls', isEnvConfigured() ? 'remote' : 'mock'],
    queryFn: async () => {
      if (!isEnvConfigured()) {
        return getMockPreferenceControls();
      }
      return fetchPreferenceControls();
    },
  });

  const unblockMutation = useMutation({
    mutationFn: unblockCreator,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['preference-controls'] });
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading blocked creators" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load blocks"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const blocked = query.data.blockedCreators;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Safety
      </Text>
      <Text variant="heading" accessibilityRole="header">
        Blocked creators
      </Text>
      <Text variant="body" tone="secondary">
        Blocked creators and their work stay out of Discover, search, and your follows. Unblocking
        is immediate.
      </Text>

      {blocked.length === 0 ? (
        <EmptyState
          title="No blocked creators"
          description="When you block someone from a profile or design, they appear here."
          actionLabel="Back to Settings"
          onAction={() => router.back()}
        />
      ) : (
        <View style={styles.list}>
          {blocked.map((creator) => (
            <View key={creator.id} style={styles.row}>
              <View style={styles.copy}>
                <Text variant="bodyStrong">
                  {creator.displayName || creator.username || 'Creator'}
                </Text>
                {creator.username ? (
                  <Text variant="caption" tone="secondary">
                    @{creator.username}
                  </Text>
                ) : null}
              </View>
              <Button
                label="Unblock"
                variant="ghost"
                fullWidth={false}
                loading={unblockMutation.isPending}
                onPress={() => {
                  void unblockMutation.mutateAsync(creator.id);
                }}
                accessibilityHint={`Unblock ${creator.displayName || creator.username || 'creator'}`}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
