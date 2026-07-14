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
    />
  );
}
