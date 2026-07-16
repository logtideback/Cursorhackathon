/** Restrained radii — rectangular imagery, minimal rounding. */
export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
