import { Stack } from 'expo-router';

import { useTheme } from '@/providers/ThemeProvider';
import { fontFamilies } from '@/theme';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fontFamilies.sansMedium },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="taste-profile" options={{ title: 'Taste Profile' }} />
      <Stack.Screen name="blocked" options={{ title: 'Blocked' }} />
      <Stack.Screen name="hidden-preferences" options={{ title: 'Hidden preferences' }} />
      <Stack.Screen
        name="delete-account"
        options={{ title: 'Delete account', headerShown: false }}
      />
      <Stack.Screen name="data-export" options={{ title: 'Data export', headerShown: false }} />
    </Stack>
  );
}
