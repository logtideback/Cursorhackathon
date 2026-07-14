import { Stack } from 'expo-router';

import { colors, fontFamilies } from '@/theme';

export default function SearchStackLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ title: 'Results' }} />
      <Stack.Screen name="filters" options={{ title: 'Filters', presentation: 'card' }} />
    </Stack>
  );
}
