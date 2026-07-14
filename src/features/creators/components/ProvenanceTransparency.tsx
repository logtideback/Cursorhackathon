import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { PROVENANCE_EXPLANATIONS } from '@/features/creators/constants';
import type { CreatorDesignCard } from '@/features/creators/types';
import { colors, spacing } from '@/theme';
import type { DesignProvenance } from '@/types/database';

type ProvenanceTransparencyProps = {
  designs: CreatorDesignCard[];
};

export function ProvenanceTransparency({ designs }: ProvenanceTransparencyProps) {
  const counts = designs.reduce<Partial<Record<DesignProvenance, number>>>((acc, design) => {
    acc[design.provenance] = (acc[design.provenance] ?? 0) + 1;
    return acc;
  }, {});

  const entries = (Object.keys(PROVENANCE_EXPLANATIONS) as DesignProvenance[])
    .map((key) => ({
      key,
      count: counts[key] ?? 0,
      ...PROVENANCE_EXPLANATIONS[key],
    }))
    .filter((entry) => entry.count > 0);

  if (entries.length === 0) {
    return (
      <Text variant="body" tone="secondary">
        Provenance will appear here once designs are published.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      <Text variant="body" tone="secondary">
        Taste surfaces how each design was made so viewers can judge craft with context.
      </Text>
      {entries.map((entry) => (
        <View key={entry.key} style={styles.row}>
          <View style={styles.head}>
            <Text variant="bodyStrong">{entry.label}</Text>
            <Text variant="caption" tone="tertiary">
              {entry.count}
            </Text>
          </View>
          <Text variant="caption" tone="secondary">
            {entry.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
