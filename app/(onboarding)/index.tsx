import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { useOnboardingStore } from '@/features/onboarding';
import { spacing } from '@/theme';

export default function OnboardingScreen() {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.copy}>
        <Text variant="label" tone="tertiary">
          How it works
        </Text>
        <Text variant="heading">Swipe with intention</Text>
        <Text variant="body" tone="secondary" style={styles.lede}>
          Right saves a design to your collection. Left dismisses it. Taste keeps the feed editorial
          — one image at a time.
        </Text>
      </View>

      <Button
        label="Start discovering"
        size="lg"
        onPress={() => {
          completeOnboarding();
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing['3xl'],
  },
  copy: {
    gap: spacing.md,
    paddingTop: spacing['4xl'],
  },
  lede: {
    maxWidth: 340,
  },
});
