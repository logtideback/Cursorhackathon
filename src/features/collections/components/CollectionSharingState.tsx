import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, spacing } from '@/theme';

type CollectionSharingStateProps = {
  isPrivate: boolean;
  shareUrlPlaceholder: string;
};

export function CollectionSharingState({
  isPrivate,
  shareUrlPlaceholder,
}: CollectionSharingStateProps) {
  return (
    <View
      style={styles.root}
      accessibilityLabel={isPrivate ? 'Private collection' : 'Public collection'}
    >
      <Text variant="label" tone="tertiary">
        Sharing
      </Text>
      {isPrivate ? (
        <Text variant="body" tone="secondary">
          Private. Unauthenticated requests never receive this collection or its items.
        </Text>
      ) : (
        <>
          <Text variant="body" tone="secondary">
            Public. Share with the Taste deep link below.
          </Text>
          <Text variant="caption" tone="tertiary" selectable>
            {shareUrlPlaceholder}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
