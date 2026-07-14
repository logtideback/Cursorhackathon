import { animation } from './animation';
import { breakpoints } from './breakpoints';
import { colors } from './colors';
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
export type { ColorToken } from './colors';
export type { RadiusToken } from './radii';
export type { ShadowToken } from './shadows';
export type { SpacingToken } from './spacing';
export type { TypographyVariant } from './typography';

export {
  animation,
  breakpoints,
  colors,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
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
