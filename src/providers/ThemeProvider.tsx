import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName as RNColorSchemeName } from 'react-native';

import {
  getColorsForScheme,
  lightColors,
  type ColorSchemeName,
  type ThemeColors,
} from '@/theme/colors';

type ThemePreference = 'system' | ColorSchemeName;

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ColorSchemeName;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'light',
  scheme: 'light',
  colors: lightColors,
  setPreference: () => undefined,
});

function resolveScheme(preference: ThemePreference, system: RNColorSchemeName): ColorSchemeName {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

/**
 * Theme provider. Default preference is `light` so the editorial paper UI stays
 * stable across StyleSheet-bound screens. Set preference to `system` or `dark`
 * when a screen is fully theme-aware.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [systemScheme, setSystemScheme] = useState<RNColorSchemeName>(
    () => Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(preference, systemScheme);
    return {
      preference,
      scheme,
      colors: getColorsForScheme(scheme),
      setPreference,
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
