import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { PROVENANCE_LABELS } from '@/features/designs/detail/constants';
import { colors, spacing } from '@/theme';
import type { DesignProvenance } from '@/types/database';

type ProvenanceLabelProps = {
  provenance: DesignProvenance;
};

export function ProvenanceLabel({ provenance }: ProvenanceLabelProps) {
  const label = PROVENANCE_LABELS[provenance];

  return (
    <View style={styles.root} accessibilityRole="text" accessibilityLabel={`Provenance: ${label}`}>
      <Text variant="label" tone="tertiary">
        Provenance
      </Text>
      <Text variant="bodyStrong">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
