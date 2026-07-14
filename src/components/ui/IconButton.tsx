import { ReactNode } from 'react';
import { StyleSheet, ViewStyle, type StyleProp } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, radii, spacing } from '@/theme';

type IconButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityLabel,
  children,
  onPress,
  disabled = false,
  size = 44,
  style,
}: IconButtonProps) {
  const { haptic } = useHaptics();

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        haptic('selection');
        onPress?.();
      }}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radii.sm,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
  },
  disabled: {
    opacity: 0.45,
  },
});
