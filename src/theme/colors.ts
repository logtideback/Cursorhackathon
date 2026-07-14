/** Editorial palette — warm paper, near-black type, one restrained accent. */
export const lightColors = {
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
  skeleton: '#E8E3DC',
  transparent: 'transparent',
} as const;

/**
 * Dark canvas tokens — charcoal paper, soft olive accent.
 * Prefer ThemeProvider + useThemeColors() over importing these into StyleSheet.create.
 */
export const darkColors = {
  background: '#141311',
  surface: '#1C1B18',
  surfaceMuted: '#24221E',
  border: '#2E2C28',
  borderStrong: '#3A3833',

  text: '#F3F0EA',
  textSecondary: '#A8A39B',
  textTertiary: '#7A756D',
  textInverse: '#141311',

  accent: '#8FAF97',
  accentMuted: '#243028',
  accentPressed: '#A4C0AB',

  success: '#8FAF97',
  warning: '#C4A35A',
  danger: '#C97A72',

  overlay: 'rgba(0, 0, 0, 0.55)',
  skeleton: '#2A2824',
  transparent: 'transparent',
} as const;

/** Default light export for module-scope StyleSheets (editorial paper UI). */
export const colors = lightColors;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentMuted: string;
  accentPressed: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  skeleton: string;
  transparent: string;
};
export type ColorToken = keyof ThemeColors;
export type ColorSchemeName = 'light' | 'dark';

export function getColorsForScheme(scheme: ColorSchemeName): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
