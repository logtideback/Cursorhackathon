import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { isEnvConfigured } from '@/lib/env';
import {
  fetchPreferenceControls,
  getMockPreferenceControls,
  resetHiddenPreferences,
  unhideCreator,
} from '@/services/preferences';
import { colors, spacing } from '@/theme';

/** Dedicated hidden preferences + hide-creator management screen. */
export function HiddenPreferencesScreen() {
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

  const unhideMutation = useMutation({
    mutationFn: unhideCreator,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['preference-controls'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (isEnvConfigured()) {
        await resetHiddenPreferences();
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['preference-controls'] });
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading hidden preferences" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load preferences"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const controls = query.data;
  const hasSignals =
    controls.hiddenCreators.length > 0 ||
    controls.dislikedStyles.length > 0 ||
    controls.dislikedTags.length > 0 ||
    controls.dislikedColourFamilies.length > 0 ||
    controls.dislikedLayoutPatterns.length > 0 ||
    controls.dislikedCategories.length > 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Taste
      </Text>
      <Text variant="heading" accessibilityRole="header">
        Hidden preferences
      </Text>
      <Text variant="body" tone="secondary">
        These signals quietly steer Discover away from creators and visual patterns you asked to see
        less of. They are private to you.
      </Text>

      <View style={styles.section}>
        <Text variant="subtitle">Hidden creators</Text>
        {controls.hiddenCreators.length === 0 ? (
          <Text variant="body" tone="secondary">
            No creators hidden. Hide keeps someone out of recommendations without a full block.
          </Text>
        ) : (
          controls.hiddenCreators.map((creator) => (
            <View key={creator.id} style={styles.row}>
              <Text variant="body">{creator.displayName || creator.username || 'Creator'}</Text>
              <Button
                label="Unhide"
                variant="ghost"
                fullWidth={false}
                loading={unhideMutation.isPending}
                onPress={() => {
                  void unhideMutation.mutateAsync(creator.id);
                }}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Show-me-less signals</Text>
        <Text variant="body" tone="secondary">
          Styles: {controls.dislikedStyles.join(', ') || 'none'}
        </Text>
        <Text variant="body" tone="secondary">
          Tags: {controls.dislikedTags.join(', ') || 'none'}
        </Text>
        <Text variant="body" tone="secondary">
          Colour families: {controls.dislikedColourFamilies.join(', ') || 'none'}
        </Text>
        <Text variant="body" tone="secondary">
          Layout patterns: {controls.dislikedLayoutPatterns.join(', ') || 'none'}
        </Text>
        <Text variant="body" tone="secondary">
          Categories: {controls.dislikedCategories.join(', ') || 'none'}
        </Text>
      </View>

      {!hasSignals ? (
        <EmptyState
          title="Nothing hidden yet"
          description="Use Show me less or Hide creator on a design to start shaping Taste."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      ) : (
        <Button
          label="Reset hidden preferences"
          variant="danger"
          loading={resetMutation.isPending}
          onPress={() => {
            Alert.alert(
              'Reset hidden preferences?',
              'Clears show-me-less signals and disliked styles, tags, colours, and layouts. Hidden creators are unhidden.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    void resetMutation.mutateAsync();
                  },
                },
              ],
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  section: {
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
});
