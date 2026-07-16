import { ReactNode, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { colors, fontFamilies, fontSizes, radii, spacing } from '@/theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  rightSlot?: ReactNode;
};

export function TextField({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  rightSlot,
  secureTextEntry,
  editable = true,
  ...rest
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="label" tone="tertiary" style={styles.label}>
        {label}
      </Text>
      <View
        style={[styles.fieldRow, error && styles.fieldRowError, !editable && styles.fieldDisabled]}
      >
        <TextInput
          {...rest}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, inputStyle]}
        />
        {isPassword ? (
          <IconButton
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((value) => !value)}
            size={44}
            style={styles.eyeButton}
          >
            <Text variant="caption" tone="secondary">
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </IconButton>
        ) : null}
        {rightSlot}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          variant="caption"
          tone="danger"
          style={styles.message}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    marginLeft: spacing.xxs,
  },
  fieldRow: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  fieldRowError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    backgroundColor: colors.transparent,
  },
  message: {
    marginLeft: spacing.xxs,
  },
});
