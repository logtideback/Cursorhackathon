import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { explainReasons } from '@/features/discover/recommendation/explanations';
import { track } from '@/lib/analytics';
import { useRecommendationMetaStore } from '@/store/recommendation-meta-store';
import { colors, radii, spacing } from '@/theme';

type WhySeeingThisProps = {
  designId: string;
};

export function WhySeeingThis({ designId }: WhySeeingThisProps) {
  const meta = useRecommendationMetaStore((s) => s.getMeta(designId));
  const explanations = meta ? explainReasons(meta.reasons) : [];
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!meta || explanations.length === 0 || trackedRef.current === designId) {
      return;
    }
    trackedRef.current = designId;
    track({
      name: 'recommendation_explanation_viewed',
      properties: {
        designId,
        reasonCount: explanations.length,
        primaryReason: meta.reasons[0],
      },
    });
  }, [designId, explanations.length, meta]);

  return (
    <View style={styles.root} accessibilityLabel="Why am I seeing this">
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
          Opened outside the Discover deck — Taste will explain recommendations when you open a
          design from your feed.
        </Text>
      )}

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
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  reason: {
    paddingVertical: spacing.xs,
  },
  diagnostics: {
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
});
