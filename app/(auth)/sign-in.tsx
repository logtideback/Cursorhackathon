import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, Text } from '@/components';
import { spacing } from '@/theme';

/**
 * Auth UI shell — wire `authApi.signInWithEmail` once forms are built.
 * Navigation to sign-up stays in this public group.
 */
export default function SignInScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text variant="label" tone="tertiary">
          Welcome
        </Text>
        <Text variant="display">Taste</Text>
        <Text variant="body" tone="secondary" style={styles.lede}>
          Swipe through interface and graphic design inspiration. Save what moves you.
        </Text>
      </View>

      <Divider />

      <View style={styles.actions}>
        <Text variant="label" tone="tertiary">
          Account
        </Text>
        <Text variant="subtitle" style={styles.subtitle}>
          Sign in to sync saves across devices.
        </Text>
        <Button
          label="Continue with email"
          onPress={() => {
            // Placeholder until auth forms ship
          }}
        />
        <Button
          label="Create an account"
          variant="secondary"
          onPress={() => {
            router.push('/(auth)/sign-up');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  brand: {
    gap: spacing.md,
    paddingTop: spacing['3xl'],
  },
  lede: {
    maxWidth: 320,
  },
  actions: {
    gap: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
});
