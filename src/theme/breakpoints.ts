export const breakpoints = {
  phone: 0,
  largePhone: 400,
  tablet: 768,
  desktop: 1024,
} as const;

export type BreakpointToken = keyof typeof breakpoints;
