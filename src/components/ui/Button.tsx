import { ActivityIndicator, StyleSheet, ViewStyle, type StyleProp } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, radii, spacing } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { haptic } = useHaptics();
  const isDisabled = disabled || loading;
  const inverse = variant === 'primary' || variant === 'danger';

  return (
    <PressableScale
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={() => {
        haptic('selection');
        onPress?.();
      }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={inverse ? colors.textInverse : colors.accent} />
      ) : (
        <Text
          variant="button"
          tone={inverse ? 'inverse' : 'primary'}
          style={variant === 'ghost' ? styles.ghostLabel : undefined}
        >
          {label}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing['2xl'],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  ghostLabel: {
    color: colors.accent,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});
