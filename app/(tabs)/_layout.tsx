import { Redirect, Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { LoadingIndicator, Screen, Text } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { colors, fontFamilies } from '@/theme';

/** Protected tab shell — requires auth + completed onboarding. */
export default function TabsLayout() {
  const status = useAuthStore((s) => s.status);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);

  if (status === 'loading' || !hasHydrated) {
    return (
      <Screen>
        <LoadingIndicator />
      </Screen>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.sansMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <TabMark color={color} label="D" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <TabMark color={color} label="S" />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <TabMark color={color} label="C" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabMark color={color} label="P" />,
        }}
      />
    </Tabs>
  );
}

function TabMark({ color, label }: { color: ColorValue; label: string }) {
  return (
    <Text style={{ color, fontSize: 13, fontFamily: fontFamilies.sansSemibold }}>{label}</Text>
  );
}
