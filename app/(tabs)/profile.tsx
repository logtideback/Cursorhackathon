import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, Text } from '@/components';
import { authApi } from '@/features/auth';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { spacing } from '@/theme';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Profile
        </Text>
        <Text variant="title">Account</Text>
        <Text variant="body" tone="secondary">
          {user?.email ?? 'Signed in'}
        </Text>
      </View>

      <Divider />

      <View style={styles.actions}>
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => {
            void authApi.signOut().then(() => {
              router.replace('/(auth)');
            });
          }}
        />
        <Button
          label="Replay onboarding"
          variant="ghost"
          onPress={() => {
            resetOnboarding();
            router.replace('/(onboarding)/preferences');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
