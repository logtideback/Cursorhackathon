import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { animation, colors, radii, spacing } from '@/theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  radius?: 'none' | 'sm';
  accessibilityLabel?: string;
};

/** Quiet pulsing placeholder — no shimmer gradients. */
export function Skeleton({
  width = '100%',
  height = 16,
  style,
  radius = 'sm',
  accessibilityLabel = 'Loading',
}: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withTiming(0.55, { duration: animation.duration.slow }), -1, true);
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius === 'none' ? 0 : radii.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

type SkeletonBlockProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  label?: string;
}>;

export function SkeletonBlock({ children, style, label = 'Loading content' }: SkeletonBlockProps) {
  return (
    <View
      style={[styles.block, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      importantForAccessibility="yes"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.skeleton,
  },
  block: {
    gap: spacing.sm,
  },
});
