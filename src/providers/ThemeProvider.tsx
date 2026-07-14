import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'taste.theme.preference';

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
 * Theme provider. Default preference is `light` for the editorial paper UI.
 * Preference is persisted; Screen + Text respond live via context.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [systemScheme, setSystemScheme] = useState<RNColorSchemeName>(
    () => Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

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
