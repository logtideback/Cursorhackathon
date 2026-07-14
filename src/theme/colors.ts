/** Editorial palette — warm paper, near-black type, one restrained accent. */
export const colors = {
  background: '#F6F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEBE6',
  border: '#E4DFD8',
  borderStrong: '#D0C9C0',

  text: '#121212',
  textSecondary: '#6E6A64',
  textTertiary: '#9A958E',
  textInverse: '#F6F4F1',

  /** Restrained forest olive — avoids purple/blue AI defaults and terracotta clichés. */
  accent: '#3E5C4A',
  accentMuted: '#D8E2DB',
  accentPressed: '#2F4638',

  success: '#3E5C4A',
  warning: '#8A6A2F',
  danger: '#8B3A32',

  overlay: 'rgba(18, 18, 18, 0.4)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
