import { Stack } from 'expo-router';

import { colors, fontFamilies } from '@/theme';

export default function CollectionLayout() {
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
      <Stack.Screen name="create" options={{ title: 'New collection' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Collection' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit collection' }} />
    </Stack>
  );
}
