import { MIN_TOUCH_TARGET } from './a11y';
import { animation } from './animation';
import { breakpoints } from './breakpoints';
import { colors, darkColors, getColorsForScheme, lightColors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  typography,
} from './typography';

export type { AnimationDuration } from './animation';
export type { BreakpointToken } from './breakpoints';
export type { ColorSchemeName, ColorToken, ThemeColors } from './colors';
export type { RadiusToken } from './radii';
export type { ShadowToken } from './shadows';
export type { SpacingToken } from './spacing';
export type { TypographyVariant } from './typography';

export {
  animation,
  breakpoints,
  colors,
  darkColors,
  fontFamilies,
  fontSizes,
  fontWeights,
  getColorsForScheme,
  letterSpacings,
  lightColors,
  lineHeights,
  MIN_TOUCH_TARGET,
  radii,
  shadows,
  spacing,
  typography,
};

export const theme = {
  colors,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  spacing,
  radii,
  shadows,
  animation,
  breakpoints,
} as const;

export type Theme = typeof theme;
