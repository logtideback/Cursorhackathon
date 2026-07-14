import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import type { TasteFacet, TasteProfileSummary } from '@/features/preferences/types';
import { isEnvConfigured } from '@/lib/env';
import {
  fetchTasteProfileSummary,
  getMockTasteProfile,
  resetRecommendationHistory,
} from '@/services/preferences';
import { colors, spacing } from '@/theme';

function FacetList({
  label,
  title,
  facets,
  empty,
}: {
  label: string;
  title: string;
  facets: TasteFacet[];
  empty: string;
}) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="tertiary">
        {label}
      </Text>
      <Text variant="subtitle">{title}</Text>
      {facets.length === 0 ? (
        <Text variant="body" tone="secondary">
          {empty}
        </Text>
      ) : (
        facets.map((facet, index) => (
          <View key={facet.key} style={styles.facetRow}>
            <Text
              variant={index === 0 ? 'title' : index < 3 ? 'subtitle' : 'body'}
              style={styles.facetLabel}
            >
              {facet.label}
            </Text>
            <Text variant="caption" tone="tertiary">
              {facet.count}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function TasteProfileScreen() {
  const query = useQuery({
    queryKey: ['taste-profile', isEnvConfigured() ? 'remote' : 'mock'],
    queryFn: async (): Promise<TasteProfileSummary> => {
      if (!isEnvConfigured()) {
        return getMockTasteProfile();
      }
      return fetchTasteProfileSummary();
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Reading your Taste" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load Taste Profile"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const profile = query.data;
  const isEmpty =
    profile.styles.length === 0 && profile.categories.length === 0 && profile.tags.length === 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Private
      </Text>
      <Text variant="display">Your Taste</Text>
      <Text variant="body" tone="secondary">
        A quiet reading of what you save — not a public scoreboard. Only you can see this.
      </Text>

      {isEmpty ? (
        <EmptyState
          label="Taste"
          title="Still gathering"
          description="Save a few designs and Taste will start sketching the shape of your eye."
        />
      ) : (
        <>
          <FacetList
            label="Styles"
            title="Most-saved styles"
            facets={profile.styles}
            empty="No recurring styles yet."
          />
          <FacetList
            label="Categories"
            title="Favourite categories"
            facets={profile.categories}
            empty="No favourite categories yet."
          />
          <FacetList
            label="Colour"
            title="Favourite colour families"
            facets={profile.colourFamilies}
            empty="No colour pattern yet."
          />
          <FacetList
            label="Tags"
            title="Common saved tags"
            facets={profile.tags}
            empty="No common tags yet."
          />
          <FacetList
            label="Platforms"
            title="Platforms you return to"
            facets={profile.platforms}
            empty="No platform lean yet."
          />
          <FacetList
            label="Industries"
            title="Industries you collect"
            facets={profile.industries}
            empty="No industry lean yet."
          />
          <FacetList
            label="Creators"
            title="Creators you save most"
            facets={profile.creators}
            empty="No creator pattern yet."
          />

          <View style={styles.section}>
            <Text variant="label" tone="tertiary">
              Shifts
            </Text>
            <Text variant="subtitle">Recent changes in preference</Text>
            {profile.shifts.length === 0 ? (
              <Text variant="body" tone="secondary">
                Your eye has been steady lately. New saves will reveal soft movements.
              </Text>
            ) : (
              profile.shifts.map((shift) => (
                <Text key={shift.key} variant="body">
                  Rising interest in {shift.label} — {shift.recentCount} recent saves, up from{' '}
                  {shift.priorCount}.
                </Text>
              ))
            )}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button
          label="Recommendation settings"
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
        <Button
          label="Reset recommendation history"
          variant="ghost"
          onPress={() => {
            Alert.alert(
              'Reset recommendation history?',
              'This clears your swipe history so Discover can start fresh. Hidden preferences stay until you reset those separately.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      if (isEnvConfigured()) {
                        await resetRecommendationHistory();
                      }
                      Alert.alert('Reset', 'Recommendation history cleared.');
                      void query.refetch();
                    })();
                  },
                },
              ],
            );
          }}
        />
      </View>
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
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  facetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  facetLabel: {
    flex: 1,
    textTransform: 'capitalize',
  },
  actions: {
    gap: spacing.sm,
  },
});
