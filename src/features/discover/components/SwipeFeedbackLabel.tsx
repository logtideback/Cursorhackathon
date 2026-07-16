import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { SWIPE_THRESHOLD } from '@/features/discover/constants';
import { colors, radii, spacing } from '@/theme';

type SwipeFeedbackLabelProps = {
  translateX: SharedValue<number>;
};

export function SwipeFeedbackLabel({ translateX }: SwipeFeedbackLabelProps) {
  const saveStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.92 + progress * 0.08 }, { rotate: '-8deg' }],
    };
  });

  const passStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.92 + progress * 0.08 }, { rotate: '8deg' }],
    };
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.label, styles.save, saveStyle]}
        accessibilityElementsHidden
      >
        <Text variant="label" tone="accent" style={styles.text}>
          Save
        </Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.label, styles.pass, passStyle]}
        accessibilityElementsHidden
      >
        <Text variant="label" tone="secondary" style={styles.text}>
          Pass
        </Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    top: spacing.xl,
    zIndex: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.xs,
    backgroundColor: colors.background,
  },
  save: {
    left: spacing.lg,
    borderColor: colors.accent,
  },
  pass: {
    right: spacing.lg,
    borderColor: colors.borderStrong,
  },
  text: {
    letterSpacing: 2,
  },
});
