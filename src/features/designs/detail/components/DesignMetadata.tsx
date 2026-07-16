import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import type { DesignDetail } from '@/features/designs/detail/types';
import { colors, spacing } from '@/theme';

type DesignMetadataProps = {
  design: DesignDetail;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="label" tone="tertiary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export function DesignMetadata({ design }: DesignMetadataProps) {
  return (
    <View style={styles.root}>
      <Text variant="heading" accessibilityRole="header">
        {design.title}
      </Text>

      {design.description ? (
        <Text variant="body" tone="secondary" style={styles.description}>
          {design.description}
        </Text>
      ) : null}

      <View style={styles.metaBlock}>
        {design.category ? <MetaRow label="Category" value={design.category} /> : null}
        {design.platform ? <MetaRow label="Platform" value={design.platform} /> : null}
        {design.industry ? <MetaRow label="Industry" value={design.industry} /> : null}
      </View>

      {design.tags.length > 0 ? (
        <View style={styles.tags}>
          <Text variant="label" tone="tertiary">
            Tags
          </Text>
          <View style={styles.tagRow}>
            {design.tags.map((tag) => (
              <Text key={tag} variant="caption" tone="secondary" style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  description: {
    maxWidth: 520,
  },
  metaBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  tags: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
