import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { animation } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PropsWithChildren<
  PressableProps & {
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
  }
>;

export function PressableScale({
  children,
  scaleTo = 0.97,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      style={[animatedStyle, style]}
      onPressIn={(event) => {
        // Reanimated shared values are intentionally mutated
        // eslint-disable-next-line react-hooks/immutability -- shared value API
        scale.value = withTiming(scaleTo, { duration: animation.duration.instant });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability -- shared value API
        scale.value = withTiming(1, { duration: animation.duration.fast });
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
