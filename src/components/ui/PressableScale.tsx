import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { animation, MIN_TOUCH_TARGET } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PropsWithChildren<
  PressableProps & {
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
    /** Enforce a 44pt minimum hit area (default true). */
    minTouchTarget?: boolean;
  }
>;

export function PressableScale({
  children,
  scaleTo = 0.97,
  style,
  disabled,
  onPressIn,
  onPressOut,
  minTouchTarget = true,
  ...rest
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        animatedStyle,
        minTouchTarget ? { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET } : null,
        style,
      ]}
      onPressIn={(event) => {
        if (!reducedMotion) {
          // eslint-disable-next-line react-hooks/immutability -- shared value API
          scale.value = withTiming(scaleTo, { duration: animation.duration.instant });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reducedMotion) {
          // eslint-disable-next-line react-hooks/immutability -- shared value API
          scale.value = withTiming(1, { duration: animation.duration.fast });
        }
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
