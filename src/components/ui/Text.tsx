import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

type TextTone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'danger';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
};

const toneColor: Record<TextTone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  inverse: colors.textInverse,
  accent: colors.accent,
  danger: colors.danger,
};

/**
 * Typography respects Dynamic Type via `allowFontScaling` (default true).
 * Caps extreme scaling so editorial layouts remain usable.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  children,
  allowFontScaling = true,
  maxFontSizeMultiplier = 1.35,
  ...rest
}: TextProps) {
  const variantStyle = typography[variant];

  return (
    <RNText
      {...rest}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[styles.base, variantStyle, { color: toneColor[tone] }, style]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
