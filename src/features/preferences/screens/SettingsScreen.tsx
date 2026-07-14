import { Button, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { AnalyticsConsentCard } from '@/features/preferences/components/AnalyticsConsentCard';
import { AppearancePreferenceCard } from '@/features/preferences/components/AppearancePreferenceCard';
import { flushPreferenceQueue } from '@/features/preferences/offline-queue';
import type { PreferenceControls } from '@/features/preferences/types';
import { isEnvConfigured } from '@/lib/env';
import {
  fetchPreferenceControls,
  getMockPreferenceControls,
  resetHiddenPreferences,
  resetRecommendationHistory,
  unhideCreator,
  updateRecommendationSettings,
} from '@/services/preferences';
import { unblockCreator } from '@/services/social';
import { colors, spacing } from '@/theme';
import type { ExplorationLevel } from '@/types/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

const EXPLORATION_OPTIONS: { id: ExplorationLevel; label: string; body: string }[] = [
  { id: 'focused', label: 'Focused', body: 'Stay close to what you already save.' },
  { id: 'balanced', label: 'Balanced', body: 'A measured mix of familiar and new.' },
  { id: 'adventurous', label: 'Adventurous', body: 'More exploratory recommendations.' },
];

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['preference-controls', isEnvConfigured() ? 'remote' : 'mock'],
    queryFn: async (): Promise<PreferenceControls> => {
      if (!isEnvConfigured()) {
        return getMockPreferenceControls();
      }
      await flushPreferenceQueue();
      return fetchPreferenceControls();
    },
  });

  const settingsMutation = useMutation({
    mutationFn: updateRecommendationSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['preference-controls'] });
    },
  });

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading settings" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load settings"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const controls = query.data;

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Settings
      </Text>
      <Text variant="display">Controls</Text>
      <Text variant="body" tone="secondary">
        Shape what Taste recommends. AI work is never automatically ranked lower unless you say so
        here.
      </Text>

      <View style={styles.section}>
        <AnalyticsConsentCard />
      </View>

      <View style={styles.section}>
        <AppearancePreferenceCard />
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Provenance in recommendations</Text>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text variant="bodyStrong">Include AI-assisted designs</Text>
            <Text variant="caption" tone="secondary">
              Work directed by a person with generative help.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Include AI-assisted designs"
            value={controls.includeAiAssisted}
            onValueChange={(value) => {
              void settingsMutation.mutateAsync({ includeAiAssisted: value });
            }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text variant="bodyStrong">Include fully AI-generated designs</Text>
            <Text variant="caption" tone="secondary">
              Imagery produced primarily by generative tools.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Include fully AI-generated designs"
            value={controls.includeFullyAiGenerated}
            onValueChange={(value) => {
              void settingsMutation.mutateAsync({ includeFullyAiGenerated: value });
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Recommendation exploration</Text>
        {EXPLORATION_OPTIONS.map((option) => {
          const selected = controls.explorationLevel === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                void settingsMutation.mutateAsync({ explorationLevel: option.id });
              }}
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text variant="bodyStrong">{option.label}</Text>
              <Text variant="caption" tone="secondary">
                {option.body}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Hidden creators</Text>
        {controls.hiddenCreators.length === 0 ? (
          <Text variant="body" tone="secondary">
            No creators hidden. Hide keeps someone out of recommendations without a full block.
          </Text>
        ) : (
          controls.hiddenCreators.map((creator) => (
            <View key={creator.id} style={styles.listRow}>
              <Text variant="body">{creator.displayName || creator.username || 'Creator'}</Text>
              <Button
                label="Unhide"
                variant="ghost"
                fullWidth={false}
                onPress={() => {
                  void unhideCreator(creator.id).then(() => {
                    void query.refetch();
                  });
                }}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Blocked creators</Text>
        {controls.blockedCreators.length === 0 ? (
          <Text variant="body" tone="secondary">
            No blocks yet. Blocking is reversible here.
          </Text>
        ) : (
          controls.blockedCreators.map((creator) => (
            <View key={creator.id} style={styles.listRow}>
              <Text variant="body">{creator.displayName || creator.username || 'Creator'}</Text>
              <Button
                label="Unblock"
                variant="ghost"
                fullWidth={false}
                onPress={() => {
                  void unblockCreator(creator.id).then(() => {
                    void query.refetch();
                  });
                }}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Disliked styles and tags</Text>
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

      <View style={styles.section}>
        <Button
          label="Open Taste Profile"
          variant="secondary"
          onPress={() => router.push('/settings/taste-profile')}
        />
        <Button
          label="Reset hidden preferences"
          variant="ghost"
          onPress={() => {
            Alert.alert(
              'Reset hidden preferences?',
              'Clears show-me-less signals and disliked styles, tags, colours, and layouts.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      if (isEnvConfigured()) {
                        await resetHiddenPreferences();
                      }
                      void query.refetch();
                    })();
                  },
                },
              ],
            );
          }}
        />
        <Button
          label="Reset recommendation history"
          variant="ghost"
          onPress={() => {
            Alert.alert(
              'Reset recommendation history?',
              'Clears swipe history so Discover can start again.',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  option: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xxs,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
