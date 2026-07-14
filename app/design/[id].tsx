import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components';
import { explainReasons } from '@/features/discover/recommendation/explanations';
import { useAuthStore } from '@/store/auth-store';
import { useRecommendationMetaStore } from '@/store/recommendation-meta-store';
import { colors, radii, spacing } from '@/theme';

export default function DesignDetailScreen() {
  const status = useAuthStore((s) => s.status);
  const { id } = useLocalSearchParams<{ id: string }>();
  const designId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const meta = useRecommendationMetaStore((s) => (designId ? s.getMeta(designId) : null));

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const explanations = meta ? explainReasons(meta.reasons) : [];

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Design
      </Text>
      <Text variant="title">{designId}</Text>
      <Text variant="body" tone="secondary">
        Full media and creator details will deepen here. Recommendation context is available below.
      </Text>

      <View style={styles.section}>
        <Text variant="label" tone="tertiary">
          Why am I seeing this?
        </Text>
        {explanations.length > 0 ? (
          explanations.map((line) => (
            <Text key={line} variant="body" style={styles.reason}>
              {line}
            </Text>
          ))
        ) : (
          <Text variant="body" tone="secondary">
            Opened outside the Discover deck — Taste will explain recommendations from your feed.
          </Text>
        )}
      </View>

      {__DEV__ && meta?.diagnostics ? (
        <View style={styles.diagnostics} accessibilityLabel="Recommendation diagnostics">
          <Text variant="label" tone="tertiary">
            Dev diagnostics
          </Text>
          <Text variant="caption" tone="secondary">
            Final score: {meta.score?.toFixed(2) ?? meta.diagnostics.finalScore.toFixed(2)}
          </Text>
          <Text variant="caption" tone="secondary">
            Penalties: {meta.diagnostics.penaltiesApplied.join(', ') || 'none'}
          </Text>
          <Text variant="caption" tone="secondary">
            Exploratory: {meta.diagnostics.isExploratory ? 'yes' : 'no'} · Cold start:{' '}
            {meta.diagnostics.isColdStart ? 'yes' : 'no'}
          </Text>
          <Text variant="caption" tone="secondary">
            Components: cat {meta.diagnostics.components.categoryMatch.toFixed(2)}, style{' '}
            {meta.diagnostics.components.styleMatch.toFixed(2)}, tags{' '}
            {meta.diagnostics.components.tagSimilarity.toFixed(2)}, follow{' '}
            {meta.diagnostics.components.followedCreator.toFixed(2)}, explore{' '}
            {meta.diagnostics.components.explorationBonus.toFixed(2)}
          </Text>
          <Text variant="caption" tone="secondary">
            Weighted sample: cat {meta.diagnostics.weighted.categoryMatch.toFixed(2)}, style{' '}
            {meta.diagnostics.weighted.styleMatch.toFixed(2)}, neg{' '}
            {meta.diagnostics.weighted.negativeTagPenalty.toFixed(2)}, rep{' '}
            {meta.diagnostics.weighted.repetitionPenalty.toFixed(2)}
          </Text>
        </View>
      ) : null}

      {/* Keep layout image-led without inventing content when no image is cached. */}
      <View style={styles.placeholder} />
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
  },
  reason: {
    paddingVertical: spacing.xs,
  },
  diagnostics: {
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    marginTop: spacing.xl,
    height: 220,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
});
