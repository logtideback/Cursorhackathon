import { Stack } from 'expo-router';

import { colors, fontFamilies } from '@/theme';

export default function SettingsLayout() {
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
    </Stack>
  );
}
