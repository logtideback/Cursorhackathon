export const fontFamilies = {
  display: 'Newsreader_400Regular',
  displayMedium: 'Newsreader_500Medium',
  displaySemibold: 'Newsreader_600SemiBold',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemibold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.45,
  relaxed: 1.6,
} as const;

export const letterSpacings = {
  tight: -0.5,
  normal: 0,
  wide: 0.8,
  wider: 1.6,
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.displaySemibold,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  heading: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  title: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
    letterSpacing: letterSpacings.tight,
  },
  subtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodyStrong: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  /** Small uppercase metadata labels used across editorial UI. */
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.snug,
    letterSpacing: letterSpacings.normal,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
