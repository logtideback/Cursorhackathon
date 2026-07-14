import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Image, Text } from '@/components';
import { mosaicLayoutForCount } from '@/features/collections/cover';
import { colors, spacing } from '@/theme';

type CollectionCoverProps = {
  urls: string[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function CollectionCover({
  urls,
  height = 180,
  style,
  accessibilityLabel = 'Collection cover',
}: CollectionCoverProps) {
  const layout = mosaicLayoutForCount(urls.length);

  if (layout === 'empty') {
    return (
      <View
        style={[styles.root, { height }, styles.empty, style]}
        accessibilityLabel={`${accessibilityLabel}, empty`}
      >
        <Text variant="label" tone="tertiary">
          Empty
        </Text>
      </View>
    );
  }

  if (layout === 'single') {
    return (
      <View style={[styles.root, { height }, style]} accessibilityLabel={accessibilityLabel}>
        <Image source={{ uri: urls[0] }} style={styles.fill} contentFit="cover" />
      </View>
    );
  }

  if (layout === 'split') {
    return (
      <View
        style={[styles.root, { height }, styles.row, style]}
        accessibilityLabel={accessibilityLabel}
      >
        <Image source={{ uri: urls[0] }} style={styles.half} contentFit="cover" />
        <View style={styles.gap} />
        <Image source={{ uri: urls[1] }} style={styles.half} contentFit="cover" />
      </View>
    );
  }

  if (layout === 'triptych') {
    return (
      <View
        style={[styles.root, { height }, styles.row, style]}
        accessibilityLabel={accessibilityLabel}
      >
        <Image source={{ uri: urls[0] }} style={styles.large} contentFit="cover" />
        <View style={styles.gap} />
        <View style={styles.stack}>
          <Image source={{ uri: urls[1] }} style={styles.stackItem} contentFit="cover" />
          <View style={styles.gap} />
          <Image source={{ uri: urls[2] }} style={styles.stackItem} contentFit="cover" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { height }, style]} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.row, styles.quadRow]}>
        <Image source={{ uri: urls[0] }} style={styles.quad} contentFit="cover" />
        <View style={styles.gap} />
        <Image source={{ uri: urls[1] }} style={styles.quad} contentFit="cover" />
      </View>
      <View style={styles.gap} />
      <View style={[styles.row, styles.quadRow]}>
        <Image source={{ uri: urls[2] }} style={styles.quad} contentFit="cover" />
        <View style={styles.gap} />
        <Image source={{ uri: urls[3] }} style={styles.quad} contentFit="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
    height: '100%',
  },
  large: {
    flex: 1.4,
    height: '100%',
  },
  stack: {
    flex: 1,
  },
  stackItem: {
    flex: 1,
    width: '100%',
  },
  quadRow: {
    flex: 1,
  },
  quad: {
    flex: 1,
    height: '100%',
  },
  gap: {
    width: spacing.xxs,
    height: spacing.xxs,
  },
});
